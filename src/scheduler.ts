'use client';

import { startTransition } from 'react';

import type { ResizeCallback } from './types.js';

/**
 * Per-frame flush entry — snapshot of callbacks + latest entry for one element.
 * @internal
 */
type FlushEntry = {
  readonly callbacks: ReadonlySet<ResizeCallback>;
  readonly entry: ResizeObserverEntry;
};

/**
 * Batching scheduler that coalesces all ResizeObserver callbacks into a single
 * `requestAnimationFrame` flush, wrapped in React `startTransition` for
 * non-urgent update scheduling.
 *
 * Uses a `Map<Element, FlushEntry>` with last-write-wins semantics so that
 * 100 simultaneous resize events produce exactly 1 React render cycle.
 *
 * @internal
 */
export class RafScheduler implements Disposable {
  readonly #queue = new Map<Element, FlushEntry>();
  #rafId: number | null = null;

  /** Enqueue a resize observation for the next rAF flush. */
  schedule(target: Element, entry: ResizeObserverEntry, cbs: Set<ResizeCallback>): void {
    this.#queue.set(target, { callbacks: cbs, entry });
    this.#requestFlush();
  }

  #requestFlush(): void {
    if (this.#rafId !== null) return;
    this.#rafId = requestAnimationFrame(() => {
      this.#rafId = null;
      this.#flush();
    });
  }

  #flush(): void {
    const snapshot = new Map(this.#queue);
    this.#queue.clear();

    startTransition(() => {
      for (const { callbacks, entry } of snapshot.values()) {
        for (const cb of callbacks) {
          cb(entry);
        }
      }
    });
  }

  /** Cancel any pending rAF and clear the queue. */
  cancel(): void {
    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
    this.#queue.clear();
  }

  /** Disposable contract (ES2026 explicit resource management). */
  [Symbol.dispose](): void {
    this.cancel();
  }
}

/** Create a new scheduler instance. @internal */
export const createScheduler = (): RafScheduler => new RafScheduler();
