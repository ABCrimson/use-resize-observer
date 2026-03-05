import { describe, expect, it } from 'vitest';
import { ResizeObserverShim, sumPrecise } from '../../src/shim.js';

describe('sumPrecise', () => {
  it('should sum an array of numbers', () => {
    expect(sumPrecise([1, 2, 3])).toBe(6);
  });

  it('should return 0 for empty array', () => {
    expect(sumPrecise([])).toBe(0);
  });

  it('should handle floating point values', () => {
    const result = sumPrecise([0.1, 0.2, 0.3]);
    expect(result).toBeCloseTo(0.6, 10);
  });

  it('should handle negative numbers', () => {
    expect(sumPrecise([-1, 2, -3, 4])).toBe(2);
  });

  it('should handle single value', () => {
    expect(sumPrecise([42])).toBe(42);
  });
});

describe('ResizeObserverShim', () => {
  it('should be a constructor', () => {
    expect(typeof ResizeObserverShim).toBe('function');
    const shim = new ResizeObserverShim(() => {});
    expect(shim).toBeDefined();
    shim.disconnect();
  });

  it('should have observe, unobserve, and disconnect methods', () => {
    const shim = new ResizeObserverShim(() => {});
    expect(typeof shim.observe).toBe('function');
    expect(typeof shim.unobserve).toBe('function');
    expect(typeof shim.disconnect).toBe('function');
    shim.disconnect();
  });

  it('should observe and unobserve elements', () => {
    const shim = new ResizeObserverShim(() => {});
    const el = document.createElement('div');
    shim.observe(el);
    shim.unobserve(el);
    shim.disconnect();
  });

  it('should disconnect all observations', () => {
    const shim = new ResizeObserverShim(() => {});
    const el1 = document.createElement('div');
    const el2 = document.createElement('span');
    shim.observe(el1);
    shim.observe(el2);
    shim.disconnect();
  });
});
