import { describe, expect, it, vi } from 'vitest';
import { createResizeObservable, ResizeEvent, type ResizeEventDetail } from '../../src/core.js';

const MockResizeObserver = (globalThis as Record<string, unknown>).MockResizeObserver as {
  readonly instances: ReadonlyArray<{
    triggerResize: (entries: ReadonlyArray<ResizeObserverEntry>) => void;
    readonly observedTargets: Map<Element, ResizeObserverOptions>;
  }>;
  findObserverFor: (el: Element) =>
    | {
        triggerResize: (entries: ReadonlyArray<ResizeObserverEntry>) => void;
        readonly observedTargets: Map<Element, ResizeObserverOptions>;
      }
    | undefined;
  createEntry: (target: Element, width: number, height: number) => ResizeObserverEntry;
};

const lastInstance = () => {
  const inst = MockResizeObserver.instances[MockResizeObserver.instances.length - 1];
  if (inst === undefined) throw new Error('No MockResizeObserver instance found');
  return inst;
};

describe('ResizeEvent', () => {
  it('should create a custom event with resize detail', () => {
    const detail = {
      width: 100,
      height: 50,
      entry: {} as ResizeObserverEntry,
    } satisfies ResizeEventDetail;
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
    } satisfies ResizeEventDetail);
    expect(event).toBeInstanceOf(CustomEvent);
  });
});

describe('createResizeObservable', () => {
  it('should return an object with disconnect and Symbol.dispose', () => {
    const el = document.createElement('div');
    using observable = createResizeObservable(el);

    expect(typeof observable.disconnect).toBe('function');
    expect(typeof observable[Symbol.dispose]).toBe('function');
    expect(typeof observable.addEventListener).toBe('function');
    expect(typeof observable.removeEventListener).toBe('function');
  });

  it('should dispatch resize events via addEventListener', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    using observable = createResizeObservable(el);
    const handler = vi.fn();

    observable.addEventListener('resize', handler as EventListener);

    const observer = lastInstance();
    const entry = MockResizeObserver.createEntry(el, 640, 480);
    observer.triggerResize([entry]);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]![0] as CustomEvent<ResizeEventDetail>;
    expect(event.detail.width).toBe(640);
    expect(event.detail.height).toBe(480);

    document.body.removeChild(el);
  });

  it('should support using declaration pattern', () => {
    const el = document.createElement('div');
    using _observable = createResizeObservable(el);
  });

  it('should accept border-box option', () => {
    const el = document.createElement('div');
    using observable = createResizeObservable(el, { box: 'border-box' as const });
    expect(typeof observable.disconnect).toBe('function');
    expect(typeof observable.addEventListener).toBe('function');
    expect(typeof observable.removeEventListener).toBe('function');
  });

  it('should accept device-pixel-content-box option', () => {
    const el = document.createElement('div');
    using observable = createResizeObservable(el, { box: 'device-pixel-content-box' as const });
    expect(typeof observable.disconnect).toBe('function');
    expect(typeof observable.addEventListener).toBe('function');
  });

  it('should default to content-box', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    using observable = createResizeObservable(el);
    const handler = vi.fn();
    observable.addEventListener('resize', handler as EventListener);

    const observer = lastInstance();
    const entry = MockResizeObserver.createEntry(el, 200, 100);
    observer.triggerResize([entry]);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]![0] as CustomEvent<ResizeEventDetail>;
    expect(event.detail.width).toBe(200);
    expect(event.detail.height).toBe(100);

    document.body.removeChild(el);
  });

  it('should dispatch events with correct dimensions for border-box', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    using observable = createResizeObservable(el, { box: 'border-box' as const });
    const handler = vi.fn();
    observable.addEventListener('resize', handler as EventListener);

    const observer = lastInstance();
    const entry = MockResizeObserver.createEntry(el, 1024, 768);
    observer.triggerResize([entry]);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]![0] as CustomEvent<ResizeEventDetail>;
    expect(event.detail.width).toBe(1024);
    expect(event.detail.height).toBe(768);

    document.body.removeChild(el);
  });

  it('should handle empty size entries gracefully', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    using observable = createResizeObservable(el);
    const handler = vi.fn();
    observable.addEventListener('resize', handler as EventListener);

    const observer = lastInstance();
    const entry = {
      target: el,
      contentRect: new DOMRectReadOnly(0, 0, 0, 0),
      borderBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
      contentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
      devicePixelContentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
    } satisfies ResizeObserverEntry;
    observer.triggerResize([entry]);

    const event = handler.mock.calls[0]![0] as CustomEvent<ResizeEventDetail>;
    expect(event.detail.width).toBe(0);
    expect(event.detail.height).toBe(0);

    document.body.removeChild(el);
  });
});
