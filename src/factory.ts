import { getSharedPool } from './pool.js';
import type { CreateResizeObserverOptions, ResizeCallback, ResizeObserverFactory } from './types.js';

/**
 * Framework-agnostic factory for creating a ResizeObserver subscription
 * using the shared pool architecture.
 *
 * Uses the same pool and scheduler as the React hook — no duplicate observers.
 *
 * @param options - Configuration options.
 * @returns An object with `observe`, `unobserve`, and `disconnect` methods.
 *
 * @example
 * ```ts
 * const observer = createResizeObserver({ box: 'border-box' });
 * observer.observe(element, (entry) => {
 *   console.log(entry.contentRect.width);
 * });
 * // Later:
 * observer.disconnect();
 * ```
 */
export const createResizeObserver = (
  options: CreateResizeObserverOptions = {},
): ResizeObserverFactory => {
  const { box = 'content-box', root = globalThis.document } = options;
  const pool = getSharedPool(root);
  const tracked = new Map<Element, Set<ResizeCallback>>();

  const observe = (target: Element, callback: ResizeCallback): void => {
    const observerOptions: ResizeObserverOptions = { box };
    pool.observe(target, observerOptions, callback);

    if (!tracked.has(target)) {
      tracked.set(target, new Set());
    }
    tracked.get(target)!.add(callback);
  };

  const unobserve = (target: Element, callback: ResizeCallback): void => {
    pool.unobserve(target, callback);
    const cbs = tracked.get(target);
    if (cbs) {
      cbs.delete(callback);
      if (cbs.size === 0) tracked.delete(target);
    }
  };

  const disconnect = (): void => {
    for (const [target, cbs] of tracked) {
      for (const cb of cbs) {
        pool.unobserve(target, cb);
      }
    }
    tracked.clear();
  };

  return { observe, unobserve, disconnect };
};
