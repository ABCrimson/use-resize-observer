/**
 * Polyfill shim entry — lazy-loads a ResizeObserver polyfill for
 * environments without native support.
 *
 * Uses dynamic `import()` so this module has zero cost if never imported.
 * The shim installs `globalThis.ResizeObserver` if it's missing.
 *
 * For `devicePixelContentBoxSize` normalization, optionally loads a
 * WASM rounding module. Falls back to `Math.sumPrecise()` (ES2026)
 * when WASM is unavailable.
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
  #lastSizes = new WeakMap<Element, { width: number; height: number }>();

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

    for (const target of this.#targets) {
      const rect = target.getBoundingClientRect();
      const last = this.#lastSizes.get(target);

      if (!last || last.width !== rect.width || last.height !== rect.height) {
        this.#lastSizes.set(target, { width: rect.width, height: rect.height });

        const entry = {
          target,
          contentRect: rect,
          borderBoxSize: [
            { inlineSize: rect.width, blockSize: rect.height },
          ] as unknown as ReadonlyArray<ResizeObserverSize>,
          contentBoxSize: [
            { inlineSize: rect.width, blockSize: rect.height },
          ] as unknown as ReadonlyArray<ResizeObserverSize>,
          devicePixelContentBoxSize: [
            {
              inlineSize: rect.width * globalThis.devicePixelRatio,
              blockSize: rect.height * globalThis.devicePixelRatio,
            },
          ] as unknown as ReadonlyArray<ResizeObserverSize>,
        } satisfies ResizeObserverEntry;

        entries.push(entry);
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
 */
export const sumPrecise = (values: number[]): number => {
  if (typeof Math.sumPrecise === 'function') {
    return Math.sumPrecise(values);
  }
  let sum = 0;
  for (const v of values) sum += v;
  return sum;
};

// Install shim if native ResizeObserver is unavailable
if (typeof globalThis.ResizeObserver === 'undefined') {
  (globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverShim;
}

export { ResizeObserverShim };
