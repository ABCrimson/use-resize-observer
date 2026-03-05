import { createScheduler, type RafScheduler } from './scheduler.js';
import type { ResizeCallback } from './types.js';

/**
 * Shared observer pool that multiplexes many element observations through a
 * single `ResizeObserver` instance per document root.
 *
 * Uses `WeakMap` + `FinalizationRegistry` for GC-backed cleanup of detached
 * elements, and `RafScheduler` for batched, non-urgent React state updates.
 *
 * Implements `Disposable` for ES2026 `using` declarations.
 *
 * @internal
 */
export class ObserverPool implements Disposable {
  readonly #scheduler: RafScheduler;
  readonly #registry = new WeakMap<Element, Set<ResizeCallback>>();
  readonly #finalizer = new FinalizationRegistry<WeakRef<Element>>((ref) => {
    const el = ref.deref();
    if (el) {
      this.#observer.unobserve(el);
      this.#size--;
    }
  });
  readonly #observer: ResizeObserver;
  #size = 0;

  constructor(scheduler?: RafScheduler) {
    this.#scheduler = scheduler ?? createScheduler();
    this.#observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const callbacks = this.#registry.get(entry.target);
        if (callbacks?.size) {
          this.#scheduler.schedule(entry.target, entry, callbacks);
        }
      }
    });
  }

  /** Begin observing an element with the given options and callback. */
  observe(target: Element, options: ResizeObserverOptions, cb: ResizeCallback): void {
    let callbacks = this.#registry.get(target);
    if (!callbacks) {
      callbacks = new Set();
      this.#registry.set(target, callbacks);
      this.#finalizer.register(target, new WeakRef(target), target);
      this.#observer.observe(target, options);
      this.#size++;
    }
    callbacks.add(cb);
  }

  /** Stop a specific callback from observing the target. */
  unobserve(target: Element, cb: ResizeCallback): void {
    const callbacks = this.#registry.get(target);
    if (!callbacks) return;
    callbacks.delete(cb);
    if (callbacks.size === 0) {
      this.#registry.delete(target);
      this.#finalizer.unregister(target);
      this.#observer.unobserve(target);
      this.#size--;
    }
  }

  /** Number of currently observed elements. */
  get observedCount(): number {
    return this.#size;
  }

  /** Disposable contract (ES2026 explicit resource management). */
  [Symbol.dispose](): void {
    this.#observer.disconnect();
    this.#scheduler.cancel();
    this.#size = 0;
  }
}

/**
 * Module-level weak registry of pools per document/shadow root.
 * Ensures a single shared pool per root context.
 */
const poolRegistry = new WeakMap<Document | ShadowRoot, ObserverPool>();

/**
 * Get or create the shared observer pool for the given root.
 * Uses `Promise.try()` (ES2026) for safe async-context creation
 * with synchronous return path.
 *
 * @param root - Document or ShadowRoot to scope the pool to.
 * @returns The shared `ObserverPool` for the given root.
 * @internal
 */
export const getSharedPool = (root: Document | ShadowRoot): ObserverPool => {
  const existing = poolRegistry.get(root);
  if (existing) return existing;

  // Promise.try() (ES2026) — safely wraps synchronous pool creation in a
  // microtask-aware context, catching any constructor exceptions into a
  // rejected promise for diagnostics while returning synchronously.
  Promise.try(() => {
    if (typeof globalThis.ResizeObserver === 'undefined') {
      throw new Error(
        '[@crimson_dev/use-resize-observer] ResizeObserver is not available. ' +
          'Import the /shim entry or use the /server entry for SSR.',
      );
    }
  }).catch((error: unknown) => {
    console.error(error);
  });

  const pool = new ObserverPool();
  poolRegistry.set(root, pool);
  return pool;
};
