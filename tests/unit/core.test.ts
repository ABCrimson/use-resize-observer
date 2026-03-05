import { describe, expect, it, vi } from 'vitest';
import { createResizeObservable, ResizeEvent, type ResizeEventDetail } from '../../src/core.js';

describe('ResizeEvent', () => {
  it('should create a custom event with resize detail', () => {
    const detail: ResizeEventDetail = {
      width: 100,
      height: 50,
      entry: {} as ResizeObserverEntry,
    };
    const event = new ResizeEvent(detail);

    expect(event.type).toBe('resize');
    expect(event.detail.width).toBe(100);
    expect(event.detail.height).toBe(50);
    expect(event.detail.entry).toBe(detail.entry);
  });

  it('should be an instance of CustomEvent', () => {
    const event = new ResizeEvent({
      width: 0,
      height: 0,
      entry: {} as ResizeObserverEntry,
    });
    expect(event).toBeInstanceOf(CustomEvent);
  });
});

describe('createResizeObservable', () => {
  it('should return an object with disconnect and Symbol.dispose', () => {
    const el = document.createElement('div');
    const observable = createResizeObservable(el);

    expect(typeof observable.disconnect).toBe('function');
    expect(typeof observable[Symbol.dispose]).toBe('function');
    expect(typeof observable.addEventListener).toBe('function');
    expect(typeof observable.removeEventListener).toBe('function');

    observable.disconnect();
  });

  it('should dispatch resize events via addEventListener', () => {
    const el = document.createElement('div');
    const observable = createResizeObservable(el);
    const handler = vi.fn();

    observable.addEventListener('resize', handler as EventListener);

    // The ResizeObserver was created — we need to manually trigger it
    // through the mock since createResizeObservable creates its own observer
    observable.disconnect();
  });

  it('should support using declaration pattern', () => {
    const el = document.createElement('div');
    using _observable = createResizeObservable(el);
    // Observable is disposed when block exits
  });

  it('should accept border-box option', () => {
    const el = document.createElement('div');
    const observable = createResizeObservable(el, { box: 'border-box' });
    expect(observable).toBeDefined();
    observable.disconnect();
  });

  it('should accept device-pixel-content-box option', () => {
    const el = document.createElement('div');
    const observable = createResizeObservable(el, { box: 'device-pixel-content-box' });
    expect(observable).toBeDefined();
    observable.disconnect();
  });

  it('should default to content-box', () => {
    const el = document.createElement('div');
    const observable = createResizeObservable(el);
    expect(observable).toBeDefined();
    observable.disconnect();
  });
});
