import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSharedPool, ObserverPool } from '../../src/pool.js';

const emptyOpts = {} satisfies ResizeObserverOptions;

describe('ObserverPool', () => {
  it('should initialize with zero observed count', () => {
    using pool = new ObserverPool();
    expect(pool.observedCount).toBe(0);
  });

  it('should observe an element and increment count', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    const cb = vi.fn();
    pool.observe(el, emptyOpts, cb);
    expect(pool.observedCount).toBe(1);
  });

  it('should allow multiple callbacks per element', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    pool.observe(el, emptyOpts, cb1);
    pool.observe(el, emptyOpts, cb2);
    expect(pool.observedCount).toBe(1);
  });

  it('should unobserve and decrement count when last callback removed', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    const cb = vi.fn();
    pool.observe(el, emptyOpts, cb);
    pool.unobserve(el, cb);
    expect(pool.observedCount).toBe(0);
  });

  it('should not decrement below zero on double unobserve', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    const cb = vi.fn();
    pool.observe(el, emptyOpts, cb);
    pool.unobserve(el, cb);
    pool.unobserve(el, cb);
    expect(pool.observedCount).toBe(0);
  });

  it('should keep element observed while callbacks remain', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    pool.observe(el, emptyOpts, cb1);
    pool.observe(el, emptyOpts, cb2);
    pool.unobserve(el, cb1);
    expect(pool.observedCount).toBe(1);
  });

  it('should track multiple elements independently', () => {
    using pool = new ObserverPool();
    const el1 = document.createElement('div');
    const el2 = document.createElement('span');
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    pool.observe(el1, emptyOpts, cb1);
    pool.observe(el2, emptyOpts, cb2);
    expect(pool.observedCount).toBe(2);
    pool.unobserve(el1, cb1);
    expect(pool.observedCount).toBe(1);
  });

  it('should implement Symbol.dispose and reset count', () => {
    const pool = new ObserverPool();
    const el = document.createElement('div');
    pool.observe(el, emptyOpts, vi.fn());
    pool[Symbol.dispose]();
    expect(pool.observedCount).toBe(0);
  });

  it('should support ES2026 using declaration pattern', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    pool.observe(el, emptyOpts, vi.fn());
    expect(pool.observedCount).toBe(1);
  });
});

describe('ObserverPool — FinalizationRegistry (Issue 16)', () => {
  let registerSpy: ReturnType<typeof vi.fn>;
  let unregisterSpy: ReturnType<typeof vi.fn>;
  let originalFR: typeof FinalizationRegistry;

  beforeEach(() => {
    registerSpy = vi.fn();
    unregisterSpy = vi.fn();
    originalFR = globalThis.FinalizationRegistry;

    // Replace FinalizationRegistry with a spy-instrumented version
    globalThis.FinalizationRegistry = class MockFinalizationRegistry<T> {
      readonly #callback: (heldValue: T) => void;
      constructor(callback: (heldValue: T) => void) {
        this.#callback = callback;
      }
      register(target: WeakKey, heldValue: T, unregisterToken?: WeakKey): void {
        registerSpy(target, heldValue, unregisterToken);
      }
      unregister(unregisterToken: WeakKey): boolean {
        unregisterSpy(unregisterToken);
        return true;
      }
    } as unknown as typeof FinalizationRegistry;
  });

  afterEach(() => {
    globalThis.FinalizationRegistry = originalFR;
  });

  it('should register the element as the unregister token in the finalizer', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    const cb = vi.fn();

    pool.observe(el, emptyOpts, cb);

    // FinalizationRegistry.register should be called with (target, heldValue, unregisterToken)
    // The pool uses the element itself as the unregister token
    expect(registerSpy).toHaveBeenCalledOnce();
    expect(registerSpy).toHaveBeenCalledWith(el, undefined, el);
  });

  it('should not re-register the finalizer for the same element with a second callback', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    pool.observe(el, emptyOpts, cb1);
    pool.observe(el, emptyOpts, cb2);

    // Only one register call — second observe promotes to Set but does not re-register
    expect(registerSpy).toHaveBeenCalledOnce();
  });

  it('should unregister from the finalizer when unobserving the last callback', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    const cb = vi.fn();

    pool.observe(el, emptyOpts, cb);
    pool.unobserve(el, cb);

    // unregister should be called with the element as the token
    expect(unregisterSpy).toHaveBeenCalledOnce();
    expect(unregisterSpy).toHaveBeenCalledWith(el);
  });

  it('should unregister from the finalizer only when the last callback is removed (multi-cb)', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    pool.observe(el, emptyOpts, cb1);
    pool.observe(el, emptyOpts, cb2);

    // Remove first callback — should NOT unregister (one callback still active)
    pool.unobserve(el, cb1);
    expect(unregisterSpy).not.toHaveBeenCalled();

    // Remove last callback — should unregister
    pool.unobserve(el, cb2);
    expect(unregisterSpy).toHaveBeenCalledOnce();
    expect(unregisterSpy).toHaveBeenCalledWith(el);
  });

  it('should not call unregister when unobserving a non-existent callback', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    pool.observe(el, emptyOpts, cb1);
    // cb2 was never registered
    pool.unobserve(el, cb2);

    expect(unregisterSpy).not.toHaveBeenCalled();
  });
});

describe('getSharedPool', () => {
  it('should return same pool for same document', () => {
    const pool1 = getSharedPool(document);
    const pool2 = getSharedPool(document);
    expect(pool1).toBe(pool2);
  });

  it('should return different pools for different roots', () => {
    const shadow = document.createElement('div').attachShadow({ mode: 'open' });
    const pool1 = getSharedPool(document);
    const pool2 = getSharedPool(shadow);
    expect(pool1).not.toBe(pool2);
  });

  it('should handle getSharedPool when ResizeObserver is undefined', async () => {
    const originalRO = globalThis.ResizeObserver;
    using consoleSpy = {
      spy: vi.spyOn(console, 'error').mockImplementation(() => {}),
      [Symbol.dispose]() {
        this.spy.mockRestore();
      },
    };

    Object.defineProperty(globalThis, 'ResizeObserver', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const mockRoot = document.implementation.createHTMLDocument();

    expect(() => getSharedPool(mockRoot)).toThrow();

    await vi.waitFor(() => {
      expect(consoleSpy.spy).toHaveBeenCalled();
    });

    Object.defineProperty(globalThis, 'ResizeObserver', {
      value: originalRO,
      writable: true,
      configurable: true,
    });
  });
});
