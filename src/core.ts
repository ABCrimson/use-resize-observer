/**
 * Framework-agnostic core observable for ResizeObserver events.
 *
 * Uses the `EventTarget` API for zero-dependency event dispatching.
 * Can be adapted by any framework (React, Solid, Vue, Svelte, vanilla).
 *
 * Implements `Disposable` for ES2026 `using` declarations.
 *
 * @example
 * ```ts
 * using observable = createResizeObservable(element, { box: 'content-box' });
 * observable.addEventListener('resize', (e) => {
 *   console.log(e.detail.width, e.detail.height);
 * });
 * ```
 */

import { extractBoxSize } from './extract.js';
import type { ResizeObserverBoxOptions } from './types.js';

/** Detail payload for resize events dispatched by the observable. */
export interface ResizeEventDetail {
  readonly width: number;
  readonly height: number;
  readonly entry: ResizeObserverEntry;
}

/** Custom event type for resize observations. */
export class ResizeEvent extends CustomEvent<ResizeEventDetail> {
  constructor(detail: ResizeEventDetail) {
    super('resize', { detail });
  }
}

/** Options for the framework-agnostic observable. */
export interface CreateResizeObservableOptions {
  /** Which box model to report. @default 'content-box' */
  box?: ResizeObserverBoxOptions;
}

/** Framework-agnostic resize observable with EventTarget-based dispatching. */
export interface ResizeObservable extends EventTarget, Disposable {
  /** Stop observing and clean up resources. */
  disconnect(): void;
}

/**
 * Concrete implementation: extends EventTarget directly for zero-overhead
 * event dispatching, avoiding Object.assign runtime cost.
 * @internal
 */
class ResizeObservableImpl extends EventTarget implements ResizeObservable {
  readonly #observer: ResizeObserver;

  constructor(target: Element, box: ResizeObserverBoxOptions) {
    super();
    this.#observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const sizeEntry = extractBoxSize(entry, box);
        this.dispatchEvent(
          new ResizeEvent({
            width: sizeEntry !== undefined ? sizeEntry.inlineSize : 0,
            height: sizeEntry !== undefined ? sizeEntry.blockSize : 0,
            entry,
          }),
        );
      }
    });
    this.#observer.observe(target, { box });
  }

  disconnect(): void {
    this.#observer.disconnect();
  }

  [Symbol.dispose](): void {
    this.disconnect();
  }
}

/**
 * Create a framework-agnostic resize observable for an element.
 *
 * @param target - The DOM element to observe.
 * @param options - Configuration options.
 * @returns A `ResizeObservable` with `addEventListener` and `disconnect`.
 */
export const createResizeObservable = (
  target: Element,
  options: CreateResizeObservableOptions = {},
): ResizeObservable => {
  const { box = 'content-box' } = options;
  return new ResizeObservableImpl(target, box);
};
