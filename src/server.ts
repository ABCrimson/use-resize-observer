import type { UseResizeObserverResult } from './types.js';

/**
 * Server-safe mock result for SSR/RSC environments.
 *
 * Returns `undefined` for all measurement values and a no-op ref,
 * preventing `ReferenceError` when `ResizeObserver` is unavailable.
 *
 * @example
 * ```tsx
 * // In an RSC or SSR context:
 * const result = createServerResizeObserverMock<HTMLDivElement>();
 * // result.width === undefined
 * // result.height === undefined
 * // result.entry === undefined
 * ```
 */
export const createServerResizeObserverMock = <
  T extends Element = Element,
>(): UseResizeObserverResult<T> => ({
  ref: { current: null },
  width: undefined,
  height: undefined,
  entry: undefined,
});

/**
 * Check whether the current environment supports ResizeObserver.
 * Safe to call on server — returns `false` without throwing.
 */
export const isResizeObserverSupported = (): boolean =>
  typeof globalThis !== 'undefined' &&
  typeof globalThis.ResizeObserver !== 'undefined';
