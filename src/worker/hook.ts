'use client';

import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { ResizeObserverBoxOptions, UseResizeObserverResult } from '../types.js';
import type { WorkerMessage } from './protocol.js';
import { allocateSlot, MAX_ELEMENTS, readSlot, releaseSlot, SAB_SIZE } from './protocol.js';

/** Options for the Worker-based resize observer hook. */
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

/** Shared Worker instance — lazy-initialized, lives until last observer unmounts. */
let sharedWorker: Worker | null = null;
let sharedSab: SharedArrayBuffer | null = null;
const slotBitmap = new Int32Array(MAX_ELEMENTS);
let activeObserverCount = 0;
let workerReady = false;

/** Promise that resolves when the Worker is initialized and ready. */
let initPromise: Promise<void> | null = null;

/**
 * Lazily initialize the shared Worker with `Promise.withResolvers()` (ES2024+).
 * Uses `Error.isError()` (ES2026) for robust error discrimination.
 */
const ensureWorker = (): Promise<void> => {
  if (initPromise) return initPromise;

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  initPromise = promise;

  Promise.try(() => {
    if (!globalThis.crossOriginIsolated) {
      throw new Error(
        '[@crimson_dev/use-resize-observer/worker] ' +
          'crossOriginIsolated is false. Worker mode requires COOP/COEP headers. ' +
          'See: https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated',
      );
    }

    sharedSab = new SharedArrayBuffer(SAB_SIZE);
    const workerUrl = new URL('./worker.js', import.meta.url);
    sharedWorker = new Worker(workerUrl, { type: 'module' });

    sharedWorker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
      if (event.data.op === 'ready') {
        workerReady = true;
        resolve();
      } else if (event.data.op === 'error') {
        reject(new Error(event.data.message));
      }
    });

    sharedWorker.addEventListener('error', (event) => {
      const errorMessage = event instanceof ErrorEvent ? event.message : 'Worker error';
      reject(new Error(errorMessage));

      // Auto-restart on crash
      sharedWorker = null;
      initPromise = null;
      workerReady = false;
    });

    sharedWorker.postMessage({ op: 'init', sab: sharedSab } satisfies WorkerMessage);
  }).catch((error: unknown) => {
    reject(Error.isError(error) ? error : new Error(String(error)));
  });

  return promise;
};

const terminateWorkerIfIdle = (): void => {
  if (activeObserverCount === 0 && sharedWorker) {
    sharedWorker.postMessage({ op: 'terminate' } satisfies WorkerMessage);
    sharedWorker.terminate();
    sharedWorker = null;
    sharedSab = null;
    initPromise = null;
    workerReady = false;
    slotBitmap.fill(0);
  }
};

/**
 * Worker-based resize observer hook.
 *
 * Moves all `ResizeObserver` measurement off the main thread using
 * `SharedArrayBuffer` + `Float16Array` + `Atomics`.
 *
 * Requires `crossOriginIsolated === true` (COOP/COEP headers).
 *
 * @param options - Configuration options.
 * @returns Ref, width, height, and raw entry (entry is `undefined` in Worker mode).
 */
export const useResizeObserverWorker = <T extends Element = Element>(
  options: UseResizeObserverWorkerOptions<T> = {},
): UseResizeObserverResult<T> => {
  const { ref: externalRef, onResize } = options;

  const internalRef = useRef<T | null>(null);
  const targetRef = externalRef ?? internalRef;

  const [width, setWidth] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const slotId = allocateSlot(slotBitmap);
    if (slotId === -1) {
      console.error(
        `[@crimson_dev/use-resize-observer/worker] ` +
          `Maximum ${String(MAX_ELEMENTS)} simultaneous observations exceeded.`,
      );
      return;
    }

    activeObserverCount++;
    let cancelled = false;
    let rafId: number | null = null;

    const startPolling = (): void => {
      const poll = (): void => {
        if (cancelled || !sharedSab) return;

        const { width: w, height: h } = readSlot(sharedSab, slotId);
        setWidth(w);
        setHeight(h);
        onResizeRef.current?.({ width: w, height: h });
        rafId = requestAnimationFrame(poll);
      };
      rafId = requestAnimationFrame(poll);
    };

    ensureWorker()
      .then(() => {
        if (cancelled) return;
        sharedWorker?.postMessage({
          op: 'observe',
          slotId,
          elementId: element.id || `slot-${String(slotId)}`,
        } satisfies WorkerMessage);
        startPolling();
      })
      .catch((error: unknown) => {
        console.error('[@crimson_dev/use-resize-observer/worker] Init failed:', error);
      });

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);

      if (workerReady && sharedWorker) {
        sharedWorker.postMessage({
          op: 'unobserve',
          slotId,
        } satisfies WorkerMessage);
      }

      releaseSlot(slotBitmap, slotId);
      activeObserverCount--;
      terminateWorkerIfIdle();
    };
  }, [targetRef]);

  return { ref: targetRef, width, height, entry: undefined };
};
