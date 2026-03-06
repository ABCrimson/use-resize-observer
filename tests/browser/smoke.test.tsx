import { describe, expect, it } from 'vitest';

describe('Browser smoke tests', () => {
  it('should have ResizeObserver available', () => {
    expect(typeof ResizeObserver).toBe('function');
  });

  it('should have requestAnimationFrame available', () => {
    expect(typeof requestAnimationFrame).toBe('function');
  });

  it.skipIf(!globalThis.crossOriginIsolated)('should have SharedArrayBuffer type available', () => {
    expect(typeof SharedArrayBuffer).toBe('function');
  });
});
