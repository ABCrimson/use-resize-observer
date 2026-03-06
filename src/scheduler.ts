'use client';

import { startTransition } from 'react';

import type { ResizeCallback } from './types.js';

/**
 * Per-frame flush entry — snapshot of callbacks + latest entry for one element.
 * @internal
 */
interface FlushEntry {
  readonly callbacks: ResizeCallback | ReadonlySet<ResizeCallback>;
  readonly entry: ResizeObserverEntry;
}

/**
 * Batching scheduler that coalesces all ResizeObserver callbacks into a single
 * `requestAnimationFrame` flush, wrapped in React `startTransition` for
 * non-urgent update scheduling.
 *
 * Uses double-buffered `Map<Element, FlushEntry>` with last-write-wins
 * semantics so that 100 simultaneous resize events produce exactly 1 React
 * render cycle. Buffer swap eliminates per-flush Map allocation.
 *
 * Implements `Disposable` for ES2026 `using` declarations.
 *
 * @internal
 */
export class RafScheduler implements Disposable {
  #buffers: [Map<Element, FlushEntry>, Map<Element, FlushEntry>] = [new Map(), new Map()];
  #active = 0;
  #rafId: number | null = null;

  /** Enqueue a resize observation for the next rAF flush. */
  schedule(
    target: Element,
    entry: ResizeObserverEntry,
    cbs: ResizeCallback | ReadonlySet<ResizeCallback>,
  ): void {
    this.#buffers[this.#active]!.set(target, { callbacks: cbs, entry });
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
    // Swap buffers — zero allocation, O(1) operation
    const flushing = this.#buffers[this.#active]!;
    this.#active ^= 1;

    startTransition(() => {
      for (const { callbacks, entry } of flushing.values()) {
        if (typeof callbacks === 'function') {
          // Fast path: single callback — no iterator overhead
          callbacks(entry);
        } else {
          for (const cb of callbacks) {
            cb(entry);
          }
        }
      }
    });

    flushing.clear();
  }

  /** Cancel any pending rAF and clear both buffers. */
  cancel(): void {
    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
    this.#buffers[0]!.clear();
    this.#buffers[1]!.clear();
  }

  /** Disposable contract (ES2026 explicit resource management). */
  [Symbol.dispose](): void {
    this.cancel();
  }
}

/** Create a new scheduler instance. @internal */
export const createScheduler = (): RafScheduler => new RafScheduler();
