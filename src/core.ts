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
 * Extract the first size entry for the given box model.
 * @internal
 */
const extractBoxSize = (
  entry: ResizeObserverEntry,
  box: ResizeObserverBoxOptions,
): ResizeObserverSize | undefined => {
  switch (box) {
    case 'border-box':
      return entry.borderBoxSize[0];
    case 'device-pixel-content-box':
      return (entry.devicePixelContentBoxSize ?? entry.contentBoxSize)[0];
    default:
      return entry.contentBoxSize[0];
  }
};

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
      const sizeEntry = extractBoxSize(entry, box);

      const detail: ResizeEventDetail = {
        width: sizeEntry?.inlineSize ?? 0,
        height: sizeEntry?.blockSize ?? 0,
        entry,
      };

      eventTarget.dispatchEvent(new ResizeEvent(detail));
    }
  });

  observer.observe(target, { box });

  const disconnect = (): void => {
    observer.disconnect();
  };

  return Object.assign(eventTarget, {
    disconnect,
    [Symbol.dispose](): void {
      disconnect();
    },
  });
};
