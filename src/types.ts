import type { RefObject } from 'react';

/** Callback invoked with a ResizeObserverEntry on each resize. */
export type ResizeCallback = (entry: ResizeObserverEntry) => void;

/** Box model options for ResizeObserver observation. */
export type ResizeObserverBoxOptions = 'border-box' | 'content-box' | 'device-pixel-content-box';

/** Options for the `useResizeObserver` hook. */
export interface UseResizeObserverOptions<T extends Element = Element> {
  /** Pre-existing ref to observe. If omitted, an internal ref is created. */
  ref?: RefObject<T | null>;
  /** Which box model to report. @default 'content-box' */
  box?: ResizeObserverBoxOptions;
  /** Document or ShadowRoot scoping the pool. @default target.ownerDocument */
  root?: Document | ShadowRoot;
  /**
   * Called on every resize event. Identity is stable across renders
   * (powered by useEffectEvent) — do NOT wrap in useCallback.
   */
  onResize?: (entry: ResizeObserverEntry) => void;
}

/** Return value of the `useResizeObserver` hook. */
export interface UseResizeObserverResult<T extends Element = Element> {
  /** Attach this ref to the element you want to observe. */
  ref: RefObject<T | null>;
  /** Inline size of the observed box. undefined until first observation. */
  width: number | undefined;
  /** Block size of the observed box. undefined until first observation. */
  height: number | undefined;
  /** The raw ResizeObserverEntry. undefined until first observation. */
  entry: ResizeObserverEntry | undefined;
}

/** Options for the `createResizeObserver` factory. */
export interface CreateResizeObserverOptions {
  /** Which box model to report. @default 'content-box' */
  box?: ResizeObserverBoxOptions;
  /** Document or ShadowRoot scoping the pool. @default document */
  root?: Document | ShadowRoot;
}

/** Return type for the `createResizeObserver` factory. */
export interface ResizeObserverFactory {
  observe(target: Element, callback: ResizeCallback): void;
  unobserve(target: Element, callback: ResizeCallback): void;
  disconnect(): void;
}
