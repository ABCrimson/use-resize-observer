import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResizeObserver } from '../../src/hook.js';
import { useResizeObserverEntries } from '../../src/hook-multi.js';
import { ObserverPool } from '../../src/pool.js';

const flushRaf = (globalThis as Record<string, unknown>).flushRaf as () => void;
const MockResizeObserver = (globalThis as Record<string, unknown>).MockResizeObserver as {
  readonly instances: ReadonlyArray<{
    triggerResize: (entries: ReadonlyArray<ResizeObserverEntry>) => void;
    readonly observedTargets: Map<Element, ResizeObserverOptions>;
  }>;
  readonly allInstances: ReadonlyArray<{
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

const findObserverOrThrow = (el: Element) => {
  const observer = MockResizeObserver.findObserverFor(el);
  if (observer === undefined) throw new Error('No observer found for element');
  return observer;
};

describe('Integration — pool + hook + scheduler pipeline', () => {
  it('should propagate resize from observer through pool and scheduler to React state', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    const { result } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
      }),
    );

    // Initially undefined — no observation yet
    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();

    // Trigger a resize through the real mock observer (no pool mocking)
    const observer = findObserverOrThrow(el);
    const entry = MockResizeObserver.createEntry(el, 640, 480);
    act(() => {
      observer.triggerResize([entry]);
      flushRaf();
    });

    // State should have propagated through pool → scheduler → setState
    expect(result.current.width).toBe(640);
    expect(result.current.height).toBe(480);
    expect(result.current.entry).toBeDefined();
    expect(result.current.entry!.target).toBe(el);

    document.body.removeChild(el);
  });

  it('should handle multiple sequential resizes through the full pipeline', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };
    const onResize = vi.fn();

    const { result } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
        onResize,
      }),
    );

    const observer = findObserverOrThrow(el);

    // First resize
    act(() => {
      observer.triggerResize([MockResizeObserver.createEntry(el, 100, 50)]);
      flushRaf();
    });
    expect(result.current.width).toBe(100);
    expect(result.current.height).toBe(50);

    // Second resize
    act(() => {
      observer.triggerResize([MockResizeObserver.createEntry(el, 200, 100)]);
      flushRaf();
    });
    expect(result.current.width).toBe(200);
    expect(result.current.height).toBe(100);

    // Third resize
    act(() => {
      observer.triggerResize([MockResizeObserver.createEntry(el, 300, 150)]);
      flushRaf();
    });
    expect(result.current.width).toBe(300);
    expect(result.current.height).toBe(150);

    // onResize called for each flush
    expect(onResize).toHaveBeenCalledTimes(3);

    document.body.removeChild(el);
  });

  it('should batch multiple resizes in the same frame via scheduler (last-write-wins)', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };
    const onResize = vi.fn();

    const { result } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
        onResize,
      }),
    );

    const observer = findObserverOrThrow(el);

    // Multiple resizes before rAF flush — scheduler deduplicates per element
    act(() => {
      observer.triggerResize([MockResizeObserver.createEntry(el, 100, 50)]);
      observer.triggerResize([MockResizeObserver.createEntry(el, 200, 100)]);
      observer.triggerResize([MockResizeObserver.createEntry(el, 300, 150)]);
      flushRaf();
    });

    // Last value wins
    expect(result.current.width).toBe(300);
    expect(result.current.height).toBe(150);

    // Callback called only once per flush (last-write-wins deduplication)
    expect(onResize).toHaveBeenCalledOnce();

    document.body.removeChild(el);
  });

  it('should allow multiple hooks sharing the same element to both see updates', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const sharedRef = { current: el };

    const { result: result1 } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: sharedRef as React.RefObject<HTMLDivElement | null>,
      }),
    );

    const { result: result2 } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: sharedRef as React.RefObject<HTMLDivElement | null>,
      }),
    );

    const observer = findObserverOrThrow(el);
    const entry = MockResizeObserver.createEntry(el, 512, 384);
    act(() => {
      observer.triggerResize([entry]);
      flushRaf();
    });

    // Both hooks should receive the same dimensions
    expect(result1.current.width).toBe(512);
    expect(result1.current.height).toBe(384);
    expect(result2.current.width).toBe(512);
    expect(result2.current.height).toBe(384);

    document.body.removeChild(el);
  });

  it('should clean up all subscriptions on unmount — no leaks', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    const { unmount } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
      }),
    );

    // Element should be observed before unmount
    const observerBefore = MockResizeObserver.findObserverFor(el);
    expect(observerBefore).toBeDefined();

    unmount();

    // After unmount, element should no longer be observed
    const observerAfter = MockResizeObserver.findObserverFor(el);
    expect(observerAfter).toBeUndefined();

    document.body.removeChild(el);
  });

  it('should clean up all subscriptions when multiple hooks share an element', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const sharedRef = { current: el };

    const hook1 = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: sharedRef as React.RefObject<HTMLDivElement | null>,
      }),
    );

    const hook2 = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: sharedRef as React.RefObject<HTMLDivElement | null>,
      }),
    );

    // Both are observing via the pool
    expect(MockResizeObserver.findObserverFor(el)).toBeDefined();

    // Unmount first hook — element should still be observed by second
    hook1.unmount();
    expect(MockResizeObserver.findObserverFor(el)).toBeDefined();

    // Unmount second hook — now element should be fully unobserved
    hook2.unmount();
    expect(MockResizeObserver.findObserverFor(el)).toBeUndefined();

    document.body.removeChild(el);
  });

  it('should work with the multi-element hook through the full pipeline', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('span');
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    const ref1 = { current: el1 };
    const ref2 = { current: el2 };

    const { result } = renderHook(() =>
      useResizeObserverEntries([
        ref1 as React.RefObject<HTMLDivElement | null>,
        ref2 as React.RefObject<HTMLSpanElement | null>,
      ]),
    );

    const observer1 = findObserverOrThrow(el1);
    const observer2 = findObserverOrThrow(el2);

    act(() => {
      observer1.triggerResize([MockResizeObserver.createEntry(el1, 320, 240)]);
      observer2.triggerResize([MockResizeObserver.createEntry(el2, 160, 120)]);
      flushRaf();
    });

    const entry1 = result.current.get(el1);
    const entry2 = result.current.get(el2);

    expect(entry1 !== undefined).toBe(true);
    expect(entry1!.width).toBe(320);
    expect(entry1!.height).toBe(240);

    expect(entry2 !== undefined).toBe(true);
    expect(entry2!.width).toBe(160);
    expect(entry2!.height).toBe(120);

    document.body.removeChild(el1);
    document.body.removeChild(el2);
  });

  it('should handle single hook observing then unobserving with no stale callbacks', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };
    const onResize = vi.fn();

    const { unmount } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
        onResize,
      }),
    );

    unmount();

    // Trigger a resize after unmount — callback should NOT be called
    // The observer should have been unobserved, so findObserverFor returns undefined
    const observer = MockResizeObserver.findObserverFor(el);
    expect(observer).toBeUndefined();
    expect(onResize).not.toHaveBeenCalled();

    document.body.removeChild(el);
  });

  it('should use the pool directly without hook and verify scheduler batching', () => {
    using pool = new ObserverPool();
    const el = document.createElement('div');
    const cb = vi.fn();

    pool.observe(el, {} satisfies ResizeObserverOptions, cb);

    // Find the underlying observer and trigger a resize
    const observer = MockResizeObserver.findObserverFor(el);
    expect(observer !== undefined).toBe(true);

    const entry = MockResizeObserver.createEntry(el, 1024, 768);
    observer!.triggerResize([entry]);

    // Before rAF flush, callback should not have been called
    // (scheduler batches into rAF)
    expect(cb).not.toHaveBeenCalled();

    flushRaf();

    // After flush, callback receives the entry
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(entry);

    pool.unobserve(el, cb);
    expect(pool.observedCount).toBe(0);
  });
});
