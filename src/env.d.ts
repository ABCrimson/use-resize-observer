/**
 * ES2026+ type augmentations for features not yet in TypeScript's lib.
 *
 * These declarations will be removed once TypeScript ships native support.
 */

interface Math {
  /** ES2026: Precise floating-point sum avoiding intermediate rounding. */
  sumPrecise(values: Iterable<number>): number;
}

interface ErrorConstructor {
  /** ES2026: Type-safe error discrimination across realms. */
  isError(value: unknown): value is Error;
}
