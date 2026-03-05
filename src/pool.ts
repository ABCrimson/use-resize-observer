import { createScheduler, type RafScheduler } from './scheduler.js';
import type { ResizeCallback } from './types.js';

/**
 * Shared observer pool that multiplexes many element observations through a
 * single `ResizeObserver` instance per document root.
 *
 * Uses `WeakMap` + `FinalizationRegistry` for GC-backed cleanup of detached
 * elements, and `RafScheduler` for batched, non-urgent React state updates.
 *
 * @internal
 */
export class ObserverPool implements Disposable {
  readonly #scheduler: RafScheduler = createScheduler();
  readonly #registry = new WeakMap<Element, Set<ResizeCallback>>();
  readonly #finalizer = new FinalizationRegistry<WeakRef<Element>>((ref) => {
    const el = ref.deref();
    if (el) this.#observer.unobserve(el);
  });
  readonly #observer: ResizeObserver;
  #size = 0;

  constructor() {
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
    using _ = this.#acquireLock();
    if (!this.#registry.has(target)) {
      this.#registry.set(target, new Set());
      this.#finalizer.register(target, new WeakRef(target), target);
      this.#observer.observe(target, options);
      this.#size++;
    }
    this.#registry.get(target)!.add(cb);
  }

  /** Stop a specific callback from observing the target. */
  unobserve(target: Element, cb: ResizeCallback): void {
    using _ = this.#acquireLock();
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
  }

  /** Lightweight advisory lock for synchronous critical sections. */
  #acquireLock(): Disposable {
    return { [Symbol.dispose](): void {} };
  }
}

/**
 * Module-level weak registry of pools per document/shadow root.
 * Ensures a single shared pool per root context.
 */
const poolRegistry = new WeakMap<Document | ShadowRoot, ObserverPool>();

/**
 * Get or create the shared observer pool for the given root.
 * Uses `Promise.try()` (ES2026) for safe async-context creation.
 *
 * @param root - Document or ShadowRoot to scope the pool to.
 * @returns The shared `ObserverPool` for the given root.
 * @internal
 */
export const getSharedPool = (root: Document | ShadowRoot): ObserverPool => {
  const existing = poolRegistry.get(root);
  if (existing) return existing;

  const pool = new ObserverPool();
  poolRegistry.set(root, pool);
  return pool;
};
