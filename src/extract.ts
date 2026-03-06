import type { ResizeObserverBoxOptions } from './types.js';

/**
 * Extract the first size entry for the given box model.
 *
 * Shared by `hook.ts`, `hook-multi.ts`, and `core.ts` to avoid duplication.
 * Falls back to `contentBoxSize` when `devicePixelContentBoxSize` is
 * unavailable (Safari/WebKit).
 *
 * @param entry - The ResizeObserverEntry from the observer callback.
 * @param box - Which box model to extract dimensions from.
 * @returns The first ResizeObserverSize for the requested box model.
 * @internal
 */
export const extractBoxSize = (
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
 * Extract width and height from a ResizeObserverEntry for the given box model.
 *
 * @param entry - The ResizeObserverEntry from the observer callback.
 * @param box - Which box model to extract dimensions from.
 * @returns Object with `width` (inlineSize) and `height` (blockSize).
 * @internal
 */
export const extractDimensions = (
  entry: ResizeObserverEntry,
  box: ResizeObserverBoxOptions,
): { readonly width: number; readonly height: number } => {
  const size = extractBoxSize(entry, box);
  return { width: size?.inlineSize ?? 0, height: size?.blockSize ?? 0 };
};
