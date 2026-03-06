import { describe, expect, it, vi } from 'vitest';
import { ResizeObserverShim, sumPrecise } from '../../src/shim.js';

const flushRaf = (globalThis as Record<string, unknown>).flushRaf as () => void;

const asReadonly = <const T extends ReadonlyArray<number>>(arr: T): T => arr;

describe('sumPrecise', () => {
  it('should sum an array of numbers', () => {
    expect(sumPrecise(asReadonly([1, 2, 3]))).toBe(6);
  });

  it('should return 0 for empty array', () => {
    expect(sumPrecise([])).toBe(0);
  });

  it('should handle floating point values', () => {
    const result = sumPrecise(asReadonly([0.1, 0.2, 0.3]));
    expect(result).toBeCloseTo(0.6, 10);
  });

  it('should handle negative numbers', () => {
    expect(sumPrecise(asReadonly([-1, 2, -3, 4]))).toBe(2);
  });

  it('should handle single value', () => {
    expect(sumPrecise(asReadonly([42]))).toBe(42);
  });

  it('should use native Math.sumPrecise when available', () => {
    const original = Math.sumPrecise;
    const mockSumPrecise = vi.fn((_values: Iterable<number>) => 42);
    (Math as { sumPrecise: typeof Math.sumPrecise }).sumPrecise = mockSumPrecise;

    const result = sumPrecise([1, 2, 3]);
    expect(result).toBe(42);
    expect(mockSumPrecise).toHaveBeenCalledWith([1, 2, 3]);

    (Math as { sumPrecise: typeof Math.sumPrecise }).sumPrecise = original;
  });
});

describe('ResizeObserverShim', () => {
  it('should be a constructor', () => {
    expect(typeof ResizeObserverShim).toBe('function');
    const shim = new ResizeObserverShim(() => {});
    expect(shim).toBeDefined();
  });

  it('should have observe, unobserve, and disconnect methods', () => {
    const shim = new ResizeObserverShim(() => {});
    expect(typeof shim.observe).toBe('function');
    expect(typeof shim.unobserve).toBe('function');
    expect(typeof shim.disconnect).toBe('function');
  });

  it('should observe and unobserve elements', () => {
    const shim = new ResizeObserverShim(() => {});
    const el = document.createElement('div');
    shim.observe(el);
    shim.unobserve(el);
  });

  it('should disconnect all observations', () => {
    const shim = new ResizeObserverShim(() => {});
    const el1 = document.createElement('div');
    const el2 = document.createElement('span');
    shim.observe(el1);
    shim.observe(el2);
    shim.disconnect();
  });

  it('should stop polling when last element is unobserved', () => {
    const cb = vi.fn();
    const shim = new ResizeObserverShim(cb);
    const el = document.createElement('div');
    shim.observe(el);
    shim.unobserve(el);
    flushRaf();
    expect(cb).not.toHaveBeenCalled();
  });

  it('should detect size changes and call callback', () => {
    const cb = vi.fn();
    const shim = new ResizeObserverShim(cb);
    const el = document.createElement('div');
    document.body.appendChild(el);

    let width = 100;
    let height = 50;
    vi.spyOn(el, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, 0, width, height),
    );

    shim.observe(el);

    flushRaf();
    expect(cb).toHaveBeenCalledTimes(1);

    flushRaf();
    expect(cb).toHaveBeenCalledTimes(1);

    width = 200;
    height = 100;
    flushRaf();
    expect(cb).toHaveBeenCalledTimes(2);

    const lastCall = cb.mock.calls[1]!;
    const entries = lastCall[0] as ReadonlyArray<ResizeObserverEntry>;
    expect(entries).toHaveLength(1);
    expect(entries[0]!.target).toBe(el);
    expect(entries[0]!.contentBoxSize[0]!.inlineSize).toBe(200);
    expect(entries[0]!.borderBoxSize[0]!.inlineSize).toBe(200);

    shim.disconnect();
    document.body.removeChild(el);
  });

  it('should include devicePixelContentBoxSize with dpr scaling', () => {
    const cb = vi.fn();
    const shim = new ResizeObserverShim(cb);
    const el = document.createElement('div');
    document.body.appendChild(el);

    vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, 0, 100, 50));

    const originalDpr = globalThis.devicePixelRatio;
    Object.defineProperty(globalThis, 'devicePixelRatio', { value: 2, writable: true });

    shim.observe(el);
    flushRaf();

    const entries = cb.mock.calls[0]![0] as ReadonlyArray<ResizeObserverEntry>;
    expect(entries[0]!.devicePixelContentBoxSize[0]!.inlineSize).toBe(200);
    expect(entries[0]!.devicePixelContentBoxSize[0]!.blockSize).toBe(100);

    Object.defineProperty(globalThis, 'devicePixelRatio', {
      value: originalDpr,
      writable: true,
    });
    shim.disconnect();
    document.body.removeChild(el);
  });

  it('should handle multiple observed elements', () => {
    const cb = vi.fn();
    const shim = new ResizeObserverShim(cb);
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    document.body.appendChild(el1);
    document.body.appendChild(el2);

    vi.spyOn(el1, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, 0, 100, 50));
    vi.spyOn(el2, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, 0, 200, 100));

    shim.observe(el1);
    shim.observe(el2);

    flushRaf();
    expect(cb).toHaveBeenCalledTimes(1);
    const entries = cb.mock.calls[0]![0] as ReadonlyArray<ResizeObserverEntry>;
    expect(entries).toHaveLength(2);

    shim.disconnect();
    document.body.removeChild(el1);
    document.body.removeChild(el2);
  });
});
