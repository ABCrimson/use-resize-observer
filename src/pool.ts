import { createScheduler, type RafScheduler } from './scheduler.js';
import type { ResizeCallback } from './types.js';

/**
 * Shared observer pool that multiplexes many element observations through a
 * single `ResizeObserver` instance per document root.
 *
 * Uses a single-callback fast path (no Set allocation when only 1 callback
 * per element), `WeakMap` + `FinalizationRegistry` for GC-backed cleanup,
 * and `RafScheduler` for batched, non-urgent React state updates.
 *
 * Implements `Disposable` for ES2026 `using` declarations.
 *
 * @internal
 */
export class ObserverPool implements Disposable {
  readonly #scheduler: RafScheduler;
  readonly #registry = new WeakMap<Element, ResizeCallback | Set<ResizeCallback>>();
  readonly #finalizer = new FinalizationRegistry<void>(() => {
    // Element was GC'd — the browser's ResizeObserver internally stops
    // observing garbage-collected targets. We only need to correct the
    // size counter. WeakMap entries auto-clean on GC.
    this.#size--;
  });
  readonly #observer: ResizeObserver;
  #size = 0;

  constructor(scheduler?: RafScheduler, Ctor?: typeof ResizeObserver) {
    this.#scheduler = scheduler ?? createScheduler();
    const ResolvedCtor = Ctor ?? globalThis.ResizeObserver;
    this.#observer = new ResolvedCtor((entries) => {
      for (const entry of entries) {
        const slot = this.#registry.get(entry.target);
        // Fast path: single callback stored directly, Set for multi
        if (slot !== undefined && (typeof slot === 'function' || slot.size > 0)) {
          this.#scheduler.schedule(entry.target, entry, slot);
        }
      }
    });
  }

  /** Begin observing an element with the given options and callback. */
  observe(target: Element, options: ResizeObserverOptions, cb: ResizeCallback): void {
    const existing = this.#registry.get(target);
    if (!existing) {
      // Fast path: store callback directly, no Set allocation
      this.#registry.set(target, cb);
      this.#finalizer.register(target, undefined, target);
      this.#size++;
    } else if (typeof existing === 'function') {
      if (existing !== cb) {
        // Promote to Set on second callback
        const set = new Set<ResizeCallback>();
        set.add(existing);
        set.add(cb);
        this.#registry.set(target, set);
      }
    } else {
      existing.add(cb);
    }
    // Always (re-)observe with the latest options.
    // ResizeObserver.observe() updates options for already-observed targets.
    this.#observer.observe(target, options);
  }

  /** Stop a specific callback from observing the target. */
  unobserve(target: Element, cb: ResizeCallback): void {
    const existing = this.#registry.get(target);
    if (!existing) return;

    if (typeof existing === 'function') {
      if (existing !== cb) return;
      this.#registry.delete(target);
      this.#finalizer.unregister(target);
      this.#observer.unobserve(target);
      this.#size--;
    } else {
      existing.delete(cb);
      if (existing.size === 0) {
        this.#registry.delete(target);
        this.#finalizer.unregister(target);
        this.#observer.unobserve(target);
        this.#size--;
      } else if (existing.size === 1) {
        // Demote back to single callback — reclaim Set memory
        const remaining = existing.values().next().value as ResizeCallback;
        this.#registry.set(target, remaining);
      }
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
 *
 * When a custom `ResizeObserver` constructor is provided (via context DI),
 * a non-shared pool is created. This is intentional for testing and SSR
 * where each Provider scope should be isolated.
 *
 * @param root - Document or ShadowRoot to scope the pool to.
 * @param Ctor - Optional custom ResizeObserver constructor (from context).
 * @returns The `ObserverPool` for the given root.
 * @internal
 */
export const getSharedPool = (
  root: Document | ShadowRoot,
  Ctor?: typeof ResizeObserver,
): ObserverPool => {
  // Custom constructor: create a dedicated pool (not shared)
  if (Ctor !== undefined) {
    return new ObserverPool(undefined, Ctor);
  }

  const existing = poolRegistry.get(root);
  if (existing) return existing;

  if (typeof globalThis.ResizeObserver === 'undefined') {
    console.error(
      new Error(
        `[@crimson_dev/use-resize-observer] ResizeObserver is not available. Import the /shim entry or use the /server entry for SSR.`,
      ),
    );
  }

  const pool = new ObserverPool();
  poolRegistry.set(root, pool);
  return pool;
};
