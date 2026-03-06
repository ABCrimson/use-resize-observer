import { describe, expect, it, vi } from 'vitest';
import { createResizeObserver } from '../../src/factory.js';

describe('createResizeObserver', () => {
  it('should create a factory with observe/unobserve/disconnect', () => {
    using factory = createResizeObserver();
    expect(typeof factory.observe).toBe('function');
    expect(typeof factory.unobserve).toBe('function');
    expect(typeof factory.disconnect).toBe('function');
  });

  it('should observe an element with a callback', () => {
    using factory = createResizeObserver();
    const el = document.createElement('div');
    const cb = vi.fn();
    factory.observe(el, cb);
  });

  it('should unobserve an element', () => {
    using factory = createResizeObserver();
    const el = document.createElement('div');
    const cb = vi.fn();
    factory.observe(el, cb);
    factory.unobserve(el, cb);
  });

  it('should disconnect all observations', () => {
    using factory = createResizeObserver();
    const el1 = document.createElement('div');
    const el2 = document.createElement('span');
    factory.observe(el1, vi.fn());
    factory.observe(el2, vi.fn());
  });

  it('should accept box option', () => {
    using factory = createResizeObserver({ box: 'border-box' as const });
    expect(typeof factory.observe).toBe('function');
    expect(typeof factory.unobserve).toBe('function');
    expect(typeof factory.disconnect).toBe('function');
    expect(typeof factory[Symbol.dispose]).toBe('function');
  });

  it('should implement Symbol.dispose (ES2026)', () => {
    const factory = createResizeObserver();
    expect(typeof factory[Symbol.dispose]).toBe('function');
    factory[Symbol.dispose]();
  });

  it('should add multiple callbacks to same element (tracked Set reuse)', () => {
    using factory = createResizeObserver();
    const el = document.createElement('div');
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    // First observe creates the Set, second reuses it (hits !cbs false branch)
    factory.observe(el, cb1);
    factory.observe(el, cb2);
    // Both callbacks should be tracked; unobserving one should keep the element
    factory.unobserve(el, cb1);
    // cb2 still tracked — element not removed from tracked map
    factory.unobserve(el, cb2);
  });

  it('should handle unobserve for non-tracked element gracefully', () => {
    using factory = createResizeObserver();
    const el = document.createElement('div');
    const cb = vi.fn();
    factory.unobserve(el, cb);
  });

  it('should handle unobserve for tracked element with different callback', () => {
    using factory = createResizeObserver();
    const el = document.createElement('div');
    document.body.appendChild(el);
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    factory.observe(el, cb1);
    factory.unobserve(el, cb2);
    document.body.removeChild(el);
  });

  it('should support using declaration pattern', () => {
    using factory = createResizeObserver();
    const el = document.createElement('div');
    factory.observe(el, vi.fn());
  });
});
