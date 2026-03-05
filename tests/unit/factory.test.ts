import { describe, expect, it, vi } from 'vitest';
import { createResizeObserver } from '../../src/factory.js';

describe('createResizeObserver', () => {
  it('should create a factory with observe/unobserve/disconnect', () => {
    const factory = createResizeObserver();
    expect(typeof factory.observe).toBe('function');
    expect(typeof factory.unobserve).toBe('function');
    expect(typeof factory.disconnect).toBe('function');
  });

  it('should observe an element with a callback', () => {
    const factory = createResizeObserver();
    const el = document.createElement('div');
    const cb = vi.fn();
    factory.observe(el, cb);
    // Observation registered without error
    factory.disconnect();
  });

  it('should unobserve an element', () => {
    const factory = createResizeObserver();
    const el = document.createElement('div');
    const cb = vi.fn();
    factory.observe(el, cb);
    factory.unobserve(el, cb);
    factory.disconnect();
  });

  it('should disconnect all observations', () => {
    const factory = createResizeObserver();
    const el1 = document.createElement('div');
    const el2 = document.createElement('span');
    factory.observe(el1, vi.fn());
    factory.observe(el2, vi.fn());
    factory.disconnect();
  });

  it('should accept box option', () => {
    const factory = createResizeObserver({ box: 'border-box' });
    expect(factory).toBeDefined();
    factory.disconnect();
  });
});
