'use client';

import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { extractBoxSize } from './extract.js';
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
    // Track observed pairs for cleanup — avoids separate closure array
    const observed: Array<readonly [Element, ResizeCallback]> = [];

    for (const ref of refs) {
      const element = ref.current;
      if (!element) continue;

      const observerRoot = root ?? element.ownerDocument;
      const pool = getSharedPool(observerRoot);
      const currentBox = boxRef.current;

      const callback: ResizeCallback = (resizeEntry) => {
        const sizeEntry = extractBoxSize(resizeEntry, currentBox);

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

      pool.observe(element, { box: currentBox }, callback);
      observed.push([element, callback] as const);
    }

    return () => {
      for (const [element, callback] of observed) {
        const observerRoot = root ?? element.ownerDocument;
        getSharedPool(observerRoot).unobserve(element, callback);
      }
    };
  }, [refs, root]);

  return entries;
};
