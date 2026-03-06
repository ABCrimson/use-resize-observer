'use client';

import { useEffect, useRef, useState } from 'react';

import { useResizeObserverConstructor } from './context.js';
import { extractBoxSize } from './extract.js';
import { getSharedPool } from './pool.js';
import type {
  ResizeCallback,
  ResizeObserverBoxOptions,
  UseResizeObserverOptions,
  UseResizeObserverResult,
} from './types.js';

/** Internal state shape — single object to batch width+height+entry in one setState. */
interface ObserverState {
  readonly width: number;
  readonly height: number;
  readonly entry: ResizeObserverEntry;
}

/**
 * Primary React hook for observing element resize events.
 *
 * Features:
 * - Single shared `ResizeObserver` per document root (pool architecture)
 * - `requestAnimationFrame` batching with `startTransition` wrapping
 * - GC-backed cleanup via `FinalizationRegistry`
 * - React Compiler-safe (stable callback identity via ref pattern)
 * - Context DI: respects `ResizeObserverContext` for custom constructors
 *
 * @param options - Configuration options.
 * @returns Ref, width, height, and raw entry.
 *
 * @example
 * ```tsx
 * const { ref, width, height } = useResizeObserver<HTMLDivElement>();
 * return <div ref={ref}>Size: {width} x {height}</div>;
 * ```
 */
export const useResizeObserver = <T extends Element = Element>(
  options: UseResizeObserverOptions<T> = {},
): UseResizeObserverResult<T> => {
  const { ref: externalRef, box = 'content-box', root, onResize } = options;
  const ResizeObserverCtor = useResizeObserverConstructor();

  const internalRef = useRef<T | null>(null);
  const targetRef = externalRef ?? internalRef;

  const [state, setState] = useState<ObserverState | undefined>(undefined);

  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const boxRef = useRef(box);
  boxRef.current = box;

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const observerRoot = root ?? element.ownerDocument;
    // Pass custom constructor only when it differs from the global
    const isCustomCtor = ResizeObserverCtor !== globalThis.ResizeObserver;
    const pool = getSharedPool(observerRoot, isCustomCtor ? ResizeObserverCtor : undefined);

    const callback: ResizeCallback = (resizeEntry) => {
      const size = extractBoxSize(resizeEntry, boxRef.current);
      const w = size?.inlineSize ?? 0;
      const h = size?.blockSize ?? 0;
      setState({ width: w, height: h, entry: resizeEntry });
      onResizeRef.current?.(resizeEntry);
    };

    pool.observe(element, { box }, callback);

    return () => {
      pool.unobserve(element, callback);
    };
  }, [targetRef, box, root, ResizeObserverCtor]);

  return {
    ref: targetRef,
    width: state?.width,
    height: state?.height,
    entry: state?.entry,
  };
};

export type { ResizeObserverBoxOptions, UseResizeObserverOptions, UseResizeObserverResult };
