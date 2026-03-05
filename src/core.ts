/**
 * Framework-agnostic core observable for ResizeObserver events.
 *
 * Uses the `EventTarget` API for zero-dependency event dispatching.
 * Can be adapted by any framework (React, Solid, Vue, Svelte, vanilla).
 *
 * @example
 * ```ts
 * const observable = createResizeObservable(element, { box: 'content-box' });
 * observable.addEventListener('resize', (e) => {
 *   console.log(e.detail.width, e.detail.height);
 * });
 * // Cleanup:
 * observable.disconnect();
 * ```
 */

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
export interface ResizeObservable extends EventTarget {
  /** Stop observing and clean up resources. */
  disconnect(): void;
}

/**
 * Create a framework-agnostic resize observable for an element.
 *
 * Wraps a `ResizeObserver` with `EventTarget` dispatching — consumers
 * subscribe via `addEventListener('resize', handler)`.
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
  const eventTarget = new EventTarget();

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const [sizeEntry] =
        box === 'border-box'
          ? entry.borderBoxSize
          : box === 'device-pixel-content-box'
            ? (entry.devicePixelContentBoxSize ?? entry.contentBoxSize)
            : entry.contentBoxSize;

      const detail: ResizeEventDetail = {
        width: sizeEntry?.inlineSize ?? 0,
        height: sizeEntry?.blockSize ?? 0,
        entry,
      };

      eventTarget.dispatchEvent(new ResizeEvent(detail));
    }
  });

  observer.observe(target, { box });

  const observable: ResizeObservable = Object.assign(eventTarget, {
    disconnect: (): void => {
      observer.disconnect();
    },
  });

  return observable;
};
