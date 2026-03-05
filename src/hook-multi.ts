'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { getSharedPool } from './pool.js';
import type { ResizeCallback, ResizeObserverBoxOptions } from './types.js';

/** Entry data for a single observed element in the multi-element hook. */
export interface ResizeEntry {
  readonly width: number;
  readonly height: number;
  readonly entry: ResizeObserverEntry;
}

/** Options for `useResizeObserverEntries`. */
export interface UseResizeObserverEntriesOptions {
  /** Which box model to report. @default 'content-box' */
  box?: ResizeObserverBoxOptions;
  /** Document or ShadowRoot scoping the pool. @default document */
  root?: Document | ShadowRoot;
}

/**
 * Multi-element variant: observe multiple elements simultaneously through
 * a single pool subscription.
 *
 * @param refs - Array of refs pointing to elements to observe.
 * @param options - Configuration options.
 * @returns A `Map<Element, ResizeEntry>` keyed by observed element.
 *
 * @example
 * ```tsx
 * const ref1 = useRef<HTMLDivElement>(null);
 * const ref2 = useRef<HTMLDivElement>(null);
 * const entries = useResizeObserverEntries([ref1, ref2]);
 * ```
 */
export const useResizeObserverEntries = (
  refs: ReadonlyArray<RefObject<Element | null>>,
  options: UseResizeObserverEntriesOptions = {},
): Map<Element, ResizeEntry> => {
  const { box = 'content-box', root } = options;
  const [entries, setEntries] = useState<Map<Element, ResizeEntry>>(new Map());
  const boxRef = useRef(box);
  boxRef.current = box;

  useEffect(() => {
    const elements: Element[] = [];
    const callbacks: Array<[Element, ResizeCallback]> = [];
    const pools: Array<ReturnType<typeof getSharedPool>> = [];

    for (const ref of refs) {
      const element = ref.current;
      if (!element) continue;

      const observerRoot = root ?? element.ownerDocument;
      const pool = getSharedPool(observerRoot);
      const currentBox = boxRef.current;

      const callback: ResizeCallback = (resizeEntry) => {
        const [sizeEntry] =
          currentBox === 'border-box'
            ? resizeEntry.borderBoxSize
            : currentBox === 'device-pixel-content-box'
              ? (resizeEntry.devicePixelContentBoxSize ?? resizeEntry.contentBoxSize)
              : resizeEntry.contentBoxSize;

        setEntries((prev) => {
          const next = new Map(prev);
          next.set(element, {
            width: sizeEntry?.inlineSize ?? 0,
            height: sizeEntry?.blockSize ?? 0,
            entry: resizeEntry,
          });
          return next;
        });
      };

      const observerOptions: ResizeObserverOptions = { box: currentBox };
      pool.observe(element, observerOptions, callback);
      elements.push(element);
      callbacks.push([element, callback]);
      pools.push(pool);
    }

    return () => {
      for (let i = 0; i < callbacks.length; i++) {
        const [element, callback] = callbacks[i]!;
        pools[i]!.unobserve(element, callback);
      }
    };
  }, [refs, box, root]);

  return entries;
};
