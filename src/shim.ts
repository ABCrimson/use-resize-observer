/**
 * Polyfill shim entry — provides a ResizeObserver polyfill for
 * environments without native support.
 *
 * Installs `globalThis.ResizeObserver` if it's missing.
 * Uses rAF polling as the observation mechanism.
 *
 * For sub-pixel normalization, uses `Math.sumPrecise()` (ES2026)
 * with fallback to iterative addition.
 *
 * @example
 * ```ts
 * // Ensure ResizeObserver exists before using the hook:
 * import '@crimson_dev/use-resize-observer/shim';
 * import { useResizeObserver } from '@crimson_dev/use-resize-observer';
 * ```
 */

/** Minimal ResizeObserver polyfill for environments without native support. */
class ResizeObserverShim {
  readonly #callback: ResizeObserverCallback;
  readonly #targets = new Set<Element>();
  #rafId: number | null = null;
  readonly #lastSizes = new WeakMap<Element, { readonly width: number; readonly height: number }>();

  constructor(callback: ResizeObserverCallback) {
    this.#callback = callback;
  }

  observe(target: Element, _options?: ResizeObserverOptions): void {
    this.#targets.add(target);
    this.#startPolling();
  }

  unobserve(target: Element): void {
    this.#targets.delete(target);
    if (this.#targets.size === 0) this.#stopPolling();
  }

  disconnect(): void {
    this.#targets.clear();
    this.#stopPolling();
  }

  #startPolling(): void {
    if (this.#rafId !== null) return;
    const poll = (): void => {
      this.#checkForChanges();
      this.#rafId = requestAnimationFrame(poll);
    };
    this.#rafId = requestAnimationFrame(poll);
  }

  #stopPolling(): void {
    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  #checkForChanges(): void {
    const entries: ResizeObserverEntry[] = [];
    const dpr = globalThis.devicePixelRatio !== undefined ? globalThis.devicePixelRatio : 1;

    for (const target of this.#targets) {
      const rect = target.getBoundingClientRect();
      const last = this.#lastSizes.get(target);
      const w = rect.width;
      const h = rect.height;

      if (last === undefined || last.width !== w || last.height !== h) {
        this.#lastSizes.set(target, { width: w, height: h });

        entries.push({
          target,
          contentRect: rect,
          borderBoxSize: [
            { inlineSize: w, blockSize: h },
          ] as unknown as ReadonlyArray<ResizeObserverSize>,
          contentBoxSize: [
            { inlineSize: w, blockSize: h },
          ] as unknown as ReadonlyArray<ResizeObserverSize>,
          devicePixelContentBoxSize: [
            {
              inlineSize: w * dpr,
              blockSize: h * dpr,
            },
          ] as unknown as ReadonlyArray<ResizeObserverSize>,
        } satisfies ResizeObserverEntry);
      }
    }

    if (entries.length > 0) {
      this.#callback(entries, this as unknown as ResizeObserver);
    }
  }
}

/**
 * Normalize sub-pixel coordinates using `Math.sumPrecise()` (ES2026).
 * Falls back to simple addition if unavailable.
 *
 * @param values - Array of numbers to sum precisely.
 * @returns The precise sum.
 */
export const sumPrecise = (values: readonly number[]): number => {
  if (typeof Math.sumPrecise === 'function') {
    return Math.sumPrecise(values);
  }
  let sum = 0;
  for (const v of values) sum += v;
  return sum;
};

// Install shim if native ResizeObserver is unavailable
if (typeof globalThis.ResizeObserver === 'undefined') {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserverShim,
    writable: true,
    configurable: true,
  });
}

export { ResizeObserverShim };
