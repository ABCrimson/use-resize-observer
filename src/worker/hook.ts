'use client';

import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { ResizeObserverBoxOptions, UseResizeObserverResult } from '../types.js';
import {
  allocateSlot,
  MAX_ELEMENTS,
  readSlot,
  releaseSlot,
  SAB_SIZE,
  writeSlot,
} from './protocol.js';

/** Options for the SAB-based resize observer hook. */
export interface UseResizeObserverWorkerOptions<T extends Element = Element> {
  /** Pre-existing ref to observe. If omitted, an internal ref is created. */
  ref?: RefObject<T | null>;
  /** Which box model to report. @default 'content-box' */
  box?: ResizeObserverBoxOptions;
  /**
   * Called on every resize event. Identity is stable across renders
   * (powered by ref pattern) — do NOT wrap in useCallback.
   */
  onResize?: (dimensions: { readonly width: number; readonly height: number }) => void;
}

/**
 * Module-level shared state for the SAB-based observation system.
 *
 * All `useResizeObserverWorker` instances share:
 * - One `SharedArrayBuffer` (3KB) for measurements
 * - One `ResizeObserver` on the main thread
 * - One `Int32Array` slot bitmap for allocation
 *
 * The ResizeObserver runs on the main thread (DOM API requirement).
 * The SAB enables zero-copy sharing with compute workers (WebGL, WASM).
 */
let sharedSab: SharedArrayBuffer | null = null;
let sharedObserver: ResizeObserver | null = null;
const slotBitmap = new Int32Array(MAX_ELEMENTS);
const slotMap = new Map<Element, number>();
let activeObserverCount = 0;

/** Lazily initialize the shared SAB and ResizeObserver. */
const ensureSharedState = (): SharedArrayBuffer => {
  if (sharedSab !== null) return sharedSab;

  if (!globalThis.crossOriginIsolated) {
    throw new Error(
      '[@crimson_dev/use-resize-observer/worker] ' +
        'crossOriginIsolated is false. Worker mode requires COOP/COEP headers. ' +
        'See: https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated',
    );
  }

  sharedSab = new SharedArrayBuffer(SAB_SIZE);

  const sab = sharedSab;
  sharedObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const slotId = slotMap.get(entry.target);
      if (slotId !== undefined) {
        writeSlot(sab, slotId, entry);
      }
    }
  });

  return sharedSab;
};

/** Clean up shared state when no observers remain. */
const cleanupIfIdle = (): void => {
  if (activeObserverCount === 0 && sharedObserver !== null) {
    sharedObserver.disconnect();
    sharedObserver = null;
    sharedSab = null;
    slotMap.clear();
    slotBitmap.fill(0);
  }
};

/**
 * SAB-based resize observer hook.
 *
 * Uses a main-thread `ResizeObserver` that writes measurements directly
 * to a `SharedArrayBuffer` via `Float16Array` + `Atomics`. A per-hook
 * `requestAnimationFrame` poll loop reads the SAB and updates React state
 * only when the dirty flag is set — skipping unchanged frames entirely.
 *
 * The `SharedArrayBuffer` can be read by compute workers (WebGL, WASM)
 * for zero-copy access to live element dimensions.
 *
 * Requires `crossOriginIsolated === true` (COOP/COEP headers).
 *
 * @param options - Configuration options.
 * @returns Ref, width, height, and raw entry (entry is `undefined` in SAB mode).
 */
export const useResizeObserverWorker = <T extends Element = Element>(
  options: UseResizeObserverWorkerOptions<T> = {},
): UseResizeObserverResult<T> => {
  const { ref: externalRef, box = 'content-box', onResize } = options;

  const internalRef = useRef<T | null>(null);
  const targetRef = externalRef ?? internalRef;

  const [state, setState] = useState<
    { readonly width: number; readonly height: number } | undefined
  >(undefined);

  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const boxRef = useRef(box);
  boxRef.current = box;

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: SAB lifecycle setup + poll loop is inherently branchy
  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    let sab: SharedArrayBuffer;
    try {
      sab = ensureSharedState();
    } catch (error: unknown) {
      console.error(
        '[@crimson_dev/use-resize-observer/worker] Init failed:',
        Error.isError(error) ? error : new Error(String(error)),
      );
      return;
    }

    const slotId = allocateSlot(slotBitmap);
    if (slotId === -1) {
      console.error(
        `[@crimson_dev/use-resize-observer/worker] ` +
          `Maximum ${String(MAX_ELEMENTS)} simultaneous observations exceeded.`,
      );
      return;
    }

    slotMap.set(element, slotId);
    activeObserverCount++;
    // sharedObserver is guaranteed non-null after ensureSharedState()
    if (sharedObserver !== null) {
      sharedObserver.observe(element, { box });
    }

    // rAF poll loop — reads SAB only when dirty flag is set
    let cancelled = false;
    let rafId: number | null = null;
    const int32View = new Int32Array(sab);

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: SAB poll loop is inherently branchy
    const poll = (): void => {
      if (cancelled) return;

      if (Atomics.load(int32View, slotId) === 1) {
        const slot = readSlot(sab, slotId);
        const useBorder = boxRef.current === 'border-box';
        const w = useBorder ? slot.borderWidth : slot.width;
        const h = useBorder ? slot.borderHeight : slot.height;
        setState({ width: w, height: h });
        onResizeRef.current?.({ width: w, height: h });
      }

      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);

      if (sharedObserver !== null) {
        sharedObserver.unobserve(element);
      }
      slotMap.delete(element);
      releaseSlot(slotBitmap, slotId);
      activeObserverCount--;
      cleanupIfIdle();
    };
  }, [targetRef, box]);

  return { ref: targetRef, width: state?.width, height: state?.height, entry: undefined };
};
