import { describe, expect, it, vi } from 'vitest';
import { ObserverPool } from '../../src/pool.js';
import { RafScheduler } from '../../src/scheduler.js';
import type { ResizeCallback } from '../../src/types.js';

const MockResizeObserver = (globalThis as Record<string, unknown>).MockResizeObserver as {
  readonly instances: ReadonlyArray<{
    triggerResize: (entries: readonly ResizeObserverEntry[]) => void;
    readonly observedTargets: Map<Element, ResizeObserverOptions>;
  }>;
  findObserverFor: (
    el: Element,
  ) => { triggerResize: (entries: readonly ResizeObserverEntry[]) => void } | undefined;
  createEntry: (target: Element, width: number, height: number) => ResizeObserverEntry;
};

const flushRaf = (globalThis as Record<string, unknown>).flushRaf as () => void;

const emptyOpts = {} satisfies ResizeObserverOptions;

const createMockEntry = (target: Element): ResizeObserverEntry =>
  ({
    target,
    contentRect: new DOMRectReadOnly(0, 0, 100, 50),
    borderBoxSize: [
      { inlineSize: 100, blockSize: 50 },
    ] as unknown as ReadonlyArray<ResizeObserverSize>,
    contentBoxSize: [
      { inlineSize: 100, blockSize: 50 },
    ] as unknown as ReadonlyArray<ResizeObserverSize>,
    devicePixelContentBoxSize: [
      { inlineSize: 200, blockSize: 100 },
    ] as unknown as ReadonlyArray<ResizeObserverSize>,
  }) satisfies Record<string, unknown> as unknown as ResizeObserverEntry;

describe('Concurrency stress tests', () => {
  it('should handle 1000 elements observing in the same rAF frame', () => {
    using pool = new ObserverPool();

    const count = 1000;
    const elements: readonly Element[] = Array.from({ length: count }, () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'ownerDocument', { value: document });
      return el;
    });
    const callbacks: readonly ReturnType<typeof vi.fn>[] = Array.from({ length: count }, () =>
      vi.fn(),
    );

    // Observe all 1000 elements with unique callbacks
    for (let i = 0; i < count; i++) {
      pool.observe(elements[i]!, emptyOpts, callbacks[i]!);
    }

    expect(pool.observedCount).toBe(1000);

    // Trigger resize on all elements via the underlying observer
    for (let i = 0; i < count; i++) {
      const el = elements[i]!;
      const observer = MockResizeObserver.findObserverFor(el);
      if (observer === undefined) throw new Error(`No observer for element ${i}`);
      observer.triggerResize([MockResizeObserver.createEntry(el, 100, 50)]);
    }

    // Flush a single rAF frame
    flushRaf();

    // Verify all 1000 callbacks were called
    for (let i = 0; i < count; i++) {
      expect(callbacks[i]).toHaveBeenCalled();
    }

    // Unobserve all and verify count returns to 0
    for (let i = 0; i < count; i++) {
      pool.unobserve(elements[i]!, callbacks[i]!);
    }

    expect(pool.observedCount).toBe(0);
  });

  it('should handle rapid observe/unobserve cycling without leaks', () => {
    using pool = new ObserverPool();

    for (let i = 0; i < 500; i++) {
      const el = document.createElement('div');
      const cb = vi.fn();
      pool.observe(el, emptyOpts, cb);
      pool.unobserve(el, cb);
    }

    expect(pool.observedCount).toBe(0);
  });

  it('should handle concurrent observe/unobserve on the same element', () => {
    using pool = new ObserverPool();

    const el = document.createElement('div');
    Object.defineProperty(el, 'ownerDocument', { value: document });

    const callbacks: readonly ReturnType<typeof vi.fn>[] = Array.from({ length: 10 }, () =>
      vi.fn(),
    );

    // Observe the element with all 10 callbacks
    for (const cb of callbacks) {
      pool.observe(el, emptyOpts, cb);
    }

    // Element is observed once (10 callbacks share 1 observation)
    expect(pool.observedCount).toBe(1);

    // Unobserve the first 5 callbacks
    for (let i = 0; i < 5; i++) {
      pool.unobserve(el, callbacks[i]!);
    }

    // Element should still be observed (5 callbacks remain)
    expect(pool.observedCount).toBe(1);

    // Trigger resize
    const observer = MockResizeObserver.findObserverFor(el);
    if (observer === undefined) throw new Error('No observer for element');
    observer.triggerResize([MockResizeObserver.createEntry(el, 100, 50)]);

    flushRaf();

    // Verify only the remaining 5 callbacks (indices 5-9) were called
    for (let i = 0; i < 5; i++) {
      expect(callbacks[i]).not.toHaveBeenCalled();
    }
    for (let i = 5; i < 10; i++) {
      expect(callbacks[i]).toHaveBeenCalledOnce();
    }
  });

  it('should handle scheduler with 1000 elements in single flush', () => {
    using scheduler = new RafScheduler();

    const count = 1000;
    const callbacks: readonly ReturnType<typeof vi.fn>[] = Array.from({ length: count }, () =>
      vi.fn(),
    );

    // Schedule 1000 elements with mock entries and callback sets
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const entry = createMockEntry(el);
      const cbSet: ReadonlySet<ResizeCallback> = new Set([callbacks[i]!]);
      scheduler.schedule(el, entry, cbSet);
    }

    // Flush rAF once
    flushRaf();

    // Verify all 1000 callbacks were invoked exactly once
    for (let i = 0; i < count; i++) {
      expect(callbacks[i]).toHaveBeenCalledOnce();
    }
  });
});
