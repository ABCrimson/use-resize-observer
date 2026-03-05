'use client';

import { useEffect, useRef, useState } from 'react';

import { getSharedPool } from './pool.js';
import type {
  ResizeCallback,
  ResizeObserverBoxOptions,
  UseResizeObserverOptions,
  UseResizeObserverResult,
} from './types.js';

/**
 * Extract width/height from a ResizeObserverEntry based on the selected box model.
 * Uses destructuring with fallback for Safari's missing `devicePixelContentBoxSize`.
 * @internal
 */
const extractDimensions = (
  entry: ResizeObserverEntry,
  box: ResizeObserverBoxOptions,
): { readonly width: number; readonly height: number } => {
  switch (box) {
    case 'border-box': {
      const size = entry.borderBoxSize[0];
      return { width: size?.inlineSize ?? 0, height: size?.blockSize ?? 0 };
    }
    case 'device-pixel-content-box': {
      const size = (entry.devicePixelContentBoxSize ?? entry.contentBoxSize)[0];
      return { width: size?.inlineSize ?? 0, height: size?.blockSize ?? 0 };
    }
    default: {
      const size = entry.contentBoxSize[0];
      return { width: size?.inlineSize ?? 0, height: size?.blockSize ?? 0 };
    }
  }
};

/**
 * Primary React hook for observing element resize events.
 *
 * Features:
 * - Single shared `ResizeObserver` per document root (pool architecture)
 * - `requestAnimationFrame` batching with `startTransition` wrapping
 * - GC-backed cleanup via `FinalizationRegistry`
 * - React Compiler-safe (stable callback identity via ref pattern)
 * - Sub-300B gzip bundle contribution
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

  const internalRef = useRef<T | null>(null);
  const targetRef = externalRef ?? internalRef;

  const [width, setWidth] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [entry, setEntry] = useState<ResizeObserverEntry | undefined>(undefined);

  // Stable callback ref — survives re-renders without triggering re-observation.
  // Follows useEffectEvent semantics: latest closure captured, identity stable.
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const boxRef = useRef(box);
  boxRef.current = box;

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const observerRoot = root ?? element.ownerDocument;
    const pool = getSharedPool(observerRoot);
    const currentBox = boxRef.current;

    const callback: ResizeCallback = (resizeEntry) => {
      const { width: w, height: h } = extractDimensions(resizeEntry, currentBox);
      setWidth(w);
      setHeight(h);
      setEntry(resizeEntry);
      onResizeRef.current?.(resizeEntry);
    };

    pool.observe(element, { box: currentBox }, callback);

    return () => {
      pool.unobserve(element, callback);
    };
  }, [targetRef, root]);

  return { ref: targetRef, width, height, entry };
};

export type { ResizeObserverBoxOptions, UseResizeObserverOptions, UseResizeObserverResult };
