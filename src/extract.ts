import type { ResizeObserverBoxOptions } from './types.js';

/**
 * Extract the first size entry for the given box model.
 *
 * Hot path — called on every resize event. Uses direct array access
 * instead of optional chaining for maximum V8 monomorphic inline caching.
 *
 * @internal
 */
export const extractBoxSize = (
  entry: ResizeObserverEntry,
  box: ResizeObserverBoxOptions,
): ResizeObserverSize | undefined => {
  if (box === 'content-box') return entry.contentBoxSize[0];
  if (box === 'border-box') return entry.borderBoxSize[0];
  // device-pixel-content-box — fallback to contentBoxSize when unavailable
  return (entry.devicePixelContentBoxSize ?? entry.contentBoxSize)[0];
};

/**
 * Extract width and height from a ResizeObserverEntry for the given box model.
 *
 * @internal
 */
export const extractDimensions = (
  entry: ResizeObserverEntry,
  box: ResizeObserverBoxOptions,
): { readonly width: number; readonly height: number } => {
  const size = extractBoxSize(entry, box);
  return {
    width: size?.inlineSize ?? 0,
    height: size?.blockSize ?? 0,
  };
};
