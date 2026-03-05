/**
 * AssemblyScript source for devicePixelContentBoxSize normalization.
 *
 * Compiles to WASM for high-precision sub-pixel rounding.
 * Loaded dynamically via import() only when devicePixelContentBoxSize
 * is requested and WASM is available.
 *
 * Build: npx asc wasm/round.ts --outFile dist/wasm-round.wasm --optimize
 */

/** Round a value to the nearest device pixel. */
export function roundToDevicePixel(value: f64, dpr: f64): f64 {
  return Math.round(value * dpr) / dpr;
}

/** Sum an array of f64 values with extended precision. */
export function sumPrecise(values: Float64Array): f64 {
  let sum: f64 = 0;
  for (let i = 0; i < values.length; i++) {
    sum += unchecked(values[i]);
  }
  return sum;
}

/** Normalize a dimension value accounting for DPR. */
export function normalizeDimension(cssPixels: f64, dpr: f64): f64 {
  const devicePixels = Math.round(cssPixels * dpr);
  return devicePixels / dpr;
}
