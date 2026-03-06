import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useResizeObserverEntries } from '../../src/hook-multi.js';

const flushRaf = (globalThis as Record<string, unknown>).flushRaf as () => void;
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

const findObserverOrThrow = (el: Element) => {
  const observer = MockResizeObserver.findObserverFor(el);
  if (observer === undefined) throw new Error('No observer found for element');
  return observer;
};

describe('useResizeObserverEntries', () => {
  it('should return empty map with no refs', () => {
    const { result } = renderHook(() => useResizeObserverEntries([]));
    expect(result.current).toBeInstanceOf(Map);
    expect(result.current.size).toBe(0);
  });

  it('should accept an array of refs', () => {
    const ref1 = { current: null as HTMLDivElement | null };
    const ref2 = { current: null as HTMLDivElement | null };
    const { result } = renderHook(() =>
      useResizeObserverEntries([
        ref1 as React.RefObject<HTMLDivElement | null>,
        ref2 as React.RefObject<HTMLDivElement | null>,
      ]),
    );
    expect(result.current.size).toBe(0);
  });

  it('should observe attached elements and update on resize', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    const ref1 = { current: el1 };
    const ref2 = { current: el2 };

    const { result } = renderHook(() =>
      useResizeObserverEntries([
        ref1 as React.RefObject<HTMLDivElement | null>,
        ref2 as React.RefObject<HTMLDivElement | null>,
      ]),
    );

    const observer1 = findObserverOrThrow(el1);
    const entry = MockResizeObserver.createEntry(el1, 400, 300);
    act(() => {
      observer1.triggerResize([entry]);
      flushRaf();
    });

    const el1Result = result.current.get(el1);
    expect(el1Result !== undefined).toBe(true);
    expect(el1Result!.width).toBe(400);
    expect(el1Result!.height).toBe(300);

    document.body.removeChild(el1);
    document.body.removeChild(el2);
  });

  it('should skip null refs', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const ref1 = { current: null };
    const ref2 = { current: el };

    const { result } = renderHook(() =>
      useResizeObserverEntries([
        ref1 as React.RefObject<HTMLDivElement | null>,
        ref2 as React.RefObject<HTMLDivElement | null>,
      ]),
    );

    const observer = findObserverOrThrow(el);
    const entry = MockResizeObserver.createEntry(el, 200, 100);
    act(() => {
      observer.triggerResize([entry]);
      flushRaf();
    });

    expect(result.current.size).toBe(1);
    const elResult = result.current.get(el);
    expect(elResult !== undefined).toBe(true);
    expect(elResult!.width).toBe(200);

    document.body.removeChild(el);
  });

  it('should clean up on unmount', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const ref = { current: el };

    const { unmount } = renderHook(() =>
      useResizeObserverEntries([ref as React.RefObject<HTMLDivElement | null>]),
    );

    unmount();

    const observer = MockResizeObserver.findObserverFor(el);
    expect(observer).toBeUndefined();

    document.body.removeChild(el);
  });

  it('should handle entries with empty size arrays', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const ref = { current: el };

    const { result } = renderHook(() =>
      useResizeObserverEntries([ref as React.RefObject<HTMLDivElement | null>]),
    );

    const observer = findObserverOrThrow(el);
    const entry = {
      target: el,
      contentRect: new DOMRectReadOnly(0, 0, 0, 0),
      borderBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
      contentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
      devicePixelContentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
    } satisfies ResizeObserverEntry;
    act(() => {
      observer.triggerResize([entry]);
      flushRaf();
    });

    const elResult = result.current.get(el);
    expect(elResult !== undefined).toBe(true);
    expect(elResult!.width).toBe(0);
    expect(elResult!.height).toBe(0);

    document.body.removeChild(el);
  });

  it('should accept box model option', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const ref = { current: el };

    const { result } = renderHook(() =>
      useResizeObserverEntries([ref as React.RefObject<HTMLDivElement | null>], {
        box: 'border-box' as const,
      }),
    );

    const observer = findObserverOrThrow(el);
    const entry = MockResizeObserver.createEntry(el, 500, 400);
    act(() => {
      observer.triggerResize([entry]);
      flushRaf();
    });

    const elResult = result.current.get(el);
    expect(elResult !== undefined).toBe(true);
    expect(elResult!.width).toBe(500);
    document.body.removeChild(el);
  });

  it('should handle same element referenced by multiple refs (Issue 17)', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    // Two refs pointing to the same element
    const ref1 = { current: el };
    const ref2 = { current: el };

    const { result } = renderHook(() =>
      useResizeObserverEntries([
        ref1 as React.RefObject<HTMLDivElement | null>,
        ref2 as React.RefObject<HTMLDivElement | null>,
      ]),
    );

    const observer = findObserverOrThrow(el);
    const entry = MockResizeObserver.createEntry(el, 600, 400);
    act(() => {
      observer.triggerResize([entry]);
      flushRaf();
    });

    // The Map is keyed by element, so both refs resolve to the same entry
    const elResult = result.current.get(el);
    expect(elResult !== undefined).toBe(true);
    expect(elResult!.width).toBe(600);
    expect(elResult!.height).toBe(400);
    // Only one key in the map since both refs point to the same element
    expect(result.current.size).toBe(1);

    document.body.removeChild(el);
  });

  it('should handle dynamic addition of refs (Issue 17)', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('span');
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    const ref1 = { current: el1 };
    const ref2 = { current: el2 };

    // Start with one ref
    const { result, rerender } = renderHook(({ refs }) => useResizeObserverEntries(refs), {
      initialProps: {
        refs: [ref1 as React.RefObject<HTMLDivElement | null>] as ReadonlyArray<
          React.RefObject<Element | null>
        >,
      },
    });

    const observer1 = findObserverOrThrow(el1);
    act(() => {
      observer1.triggerResize([MockResizeObserver.createEntry(el1, 100, 50)]);
      flushRaf();
    });
    expect(result.current.size).toBe(1);
    expect(result.current.get(el1)!.width).toBe(100);

    // Add second ref
    rerender({
      refs: [
        ref1 as React.RefObject<HTMLDivElement | null>,
        ref2 as React.RefObject<HTMLSpanElement | null>,
      ] as ReadonlyArray<React.RefObject<Element | null>>,
    });

    const observer2 = findObserverOrThrow(el2);
    act(() => {
      observer2.triggerResize([MockResizeObserver.createEntry(el2, 200, 100)]);
      flushRaf();
    });

    const el2Result = result.current.get(el2);
    expect(el2Result !== undefined).toBe(true);
    expect(el2Result!.width).toBe(200);
    expect(el2Result!.height).toBe(100);

    document.body.removeChild(el1);
    document.body.removeChild(el2);
  });

  it('should handle dynamic removal of refs (Issue 17)', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('span');
    document.body.appendChild(el1);
    document.body.appendChild(el2);
    const ref1 = { current: el1 };
    const ref2 = { current: el2 };

    // Start with two refs
    const { rerender } = renderHook(({ refs }) => useResizeObserverEntries(refs), {
      initialProps: {
        refs: [
          ref1 as React.RefObject<HTMLDivElement | null>,
          ref2 as React.RefObject<HTMLSpanElement | null>,
        ] as ReadonlyArray<React.RefObject<Element | null>>,
      },
    });

    // Both should be observed
    expect(MockResizeObserver.findObserverFor(el1)).toBeDefined();
    expect(MockResizeObserver.findObserverFor(el2)).toBeDefined();

    // Remove second ref — rerender with only first
    rerender({
      refs: [ref1 as React.RefObject<HTMLDivElement | null>] as ReadonlyArray<
        React.RefObject<Element | null>
      >,
    });

    // el1 should still be observed, el2 should be unobserved
    expect(MockResizeObserver.findObserverFor(el1)).toBeDefined();
    // el2 was cleaned up by the effect cleanup of the previous render
    expect(MockResizeObserver.findObserverFor(el2)).toBeUndefined();

    document.body.removeChild(el1);
    document.body.removeChild(el2);
  });

  it('should not trigger re-render when dimensions are unchanged (Map optimization) (Issue 17)', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const ref = { current: el };

    const { result } = renderHook(() =>
      useResizeObserverEntries([ref as React.RefObject<HTMLDivElement | null>]),
    );

    const observer = findObserverOrThrow(el);

    // First resize
    act(() => {
      observer.triggerResize([MockResizeObserver.createEntry(el, 300, 200)]);
      flushRaf();
    });

    const mapAfterFirst = result.current;

    expect(mapAfterFirst.get(el)!.width).toBe(300);
    expect(mapAfterFirst.get(el)!.height).toBe(200);

    // Trigger same dimensions — setEntries returns prev (identity check)
    act(() => {
      observer.triggerResize([MockResizeObserver.createEntry(el, 300, 200)]);
      flushRaf();
    });

    // Map identity should be the same — setState returned prev so React keeps the reference
    expect(result.current).toBe(mapAfterFirst);

    document.body.removeChild(el);
  });
});
