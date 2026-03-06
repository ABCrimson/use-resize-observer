import { describe, expect, it, vi } from 'vitest';
import { ObserverPool } from '../../src/pool.js';
import { allocateSlot, MAX_ELEMENTS, releaseSlot } from '../../src/worker/protocol.js';

const emptyOpts = {} satisfies ResizeObserverOptions;

describe('Memory pressure', () => {
  it('should not leak memory over 10k observe/unobserve cycles', () => {
    // Pre-allocate elements and callbacks so DOM overhead is excluded
    const elements: Element[] = [];
    const callbacks: (() => void)[] = [];
    for (let i = 0; i < 10_000; i++) {
      elements.push(document.createElement('div'));
      callbacks.push(vi.fn());
    }

    const pool = new ObserverPool();

    // Warm up: one cycle to trigger any lazy init allocations
    pool.observe(elements[0]!, emptyOpts, callbacks[0]!);
    pool.unobserve(elements[0]!, callbacks[0]!);

    globalThis.gc?.();
    const baseline = process.memoryUsage().heapUsed;

    // Measure only pool observe/unobserve overhead
    for (let i = 0; i < 10_000; i++) {
      pool.observe(elements[i]!, emptyOpts, callbacks[i]!);
      pool.unobserve(elements[i]!, callbacks[i]!);
    }

    pool[Symbol.dispose]();

    globalThis.gc?.();
    const after = process.memoryUsage().heapUsed;
    const deltaBytes = after - baseline;
    const deltaMB = deltaBytes / (1024 * 1024);

    console.log(`Memory delta after 10k cycles: ${deltaMB.toFixed(2)} MB`);
    // 10 MB is generous but catches real leaks (retaining all elements would be 70 MB+)
    expect(deltaMB).toBeLessThan(10);
  });

  it('should maintain zero observed count after mass observe/unobserve', () => {
    using pool = new ObserverPool();
    const elements: Element[] = [];
    const callbacks: (() => void)[] = [];

    for (let i = 0; i < 1_000; i++) {
      const el = document.createElement('div');
      const cb = vi.fn();
      elements.push(el);
      callbacks.push(cb);
      pool.observe(el, emptyOpts, cb);
    }

    for (let i = 0; i < 1_000; i++) {
      pool.unobserve(elements[i]!, callbacks[i]!);
    }

    expect(pool.observedCount).toBe(0);
  });

  it('should handle repeated pool creation and disposal', () => {
    expect(() => {
      for (let i = 0; i < 100; i++) {
        using pool = new ObserverPool();
        const el = document.createElement('div');
        pool.observe(el, emptyOpts, vi.fn());
      }
    }).not.toThrow();
  });

  it('worker slot bitmap should fully recycle', () => {
    const bitmap = new Int32Array(MAX_ELEMENTS);

    // Allocate all 256 slots
    const firstPass: number[] = [];
    for (let i = 0; i < MAX_ELEMENTS; i++) {
      const slot = allocateSlot(bitmap);
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(MAX_ELEMENTS);
      firstPass.push(slot);
    }

    // 257th allocation should fail
    expect(allocateSlot(bitmap)).toBe(-1);

    // Release all 256
    for (const slot of firstPass) {
      releaseSlot(bitmap, slot);
    }

    // Allocate all 256 again — full recycling
    const secondPass: number[] = [];
    for (let i = 0; i < MAX_ELEMENTS; i++) {
      const slot = allocateSlot(bitmap);
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(MAX_ELEMENTS);
      secondPass.push(slot);
    }

    // Release all for cleanup
    for (const slot of secondPass) {
      releaseSlot(bitmap, slot);
    }
  });
});
