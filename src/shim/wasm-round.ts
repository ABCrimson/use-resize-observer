/**
 * Optional WASM module for devicePixelContentBoxSize normalization.
 *
 * Loaded dynamically via import() only when devicePixelContentBoxSize
 * is requested. Falls back to Math.sumPrecise() (ES2026) when WASM
 * is unavailable.
 *
 * @internal
 */

/**
 * Round a CSS pixel value to the nearest device pixel boundary.
 *
 * @param cssPixels - The CSS pixel value to round.
 * @param dpr - The device pixel ratio.
 * @returns The normalized CSS pixel value aligned to device pixels.
 */
export const roundToDevicePixel = (cssPixels: number, dpr: number): number => {
  const devicePixels = Math.round(cssPixels * dpr);
  return devicePixels / dpr;
};

/**
 * Sum an array of values with extended precision.
 *
 * Uses `Math.sumPrecise()` (ES2026) for accurate floating-point
 * accumulation, falling back to iterative addition.
 *
 * @param values - Array of numbers to sum.
 * @returns The precise sum.
 */
export const sumPrecise = (values: number[]): number => {
  if (typeof Math.sumPrecise === 'function') {
    return Math.sumPrecise(values);
  }
  let sum = 0;
  for (const v of values) sum += v;
  return sum;
};

/**
 * Normalize a dimension value accounting for device pixel ratio.
 *
 * This ensures sub-pixel rendering accuracy by rounding to the
 * nearest device pixel boundary and converting back to CSS pixels.
 *
 * @param cssPixels - The raw CSS pixel measurement.
 * @param dpr - The device pixel ratio (window.devicePixelRatio).
 * @returns The normalized CSS pixel value.
 */
export const normalizeDimension = (cssPixels: number, dpr: number): number => {
  const devicePixels = Math.round(cssPixels * dpr);
  return devicePixels / dpr;
};

/**
 * Attempt to load the WASM rounding module.
 * Returns null if WASM is unavailable.
 *
 * @internal
 */
export const loadWasmRounding = async (): Promise<{
  roundToDevicePixel: (cssPixels: number, dpr: number) => number;
  normalizeDimension: (cssPixels: number, dpr: number) => number;
} | null> => {
  try {
    // Dynamic import of the compiled WASM module
    // Falls back to JS implementation if WASM is unavailable
    const wasmUrl = new URL('../../dist/wasm-round.wasm', import.meta.url);
    const response = await fetch(wasmUrl);

    if (!response.ok) return null;

    const { instance } = await WebAssembly.instantiateStreaming(response);
    const exports = instance.exports as {
      roundToDevicePixel: (cssPixels: number, dpr: number) => number;
      normalizeDimension: (cssPixels: number, dpr: number) => number;
    };

    return {
      roundToDevicePixel: exports.roundToDevicePixel,
      normalizeDimension: exports.normalizeDimension,
    };
  } catch {
    return null;
  }
};
