import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useResizeObserverEntries } from '../../src/hook-multi.js';

const flushRaf = (globalThis as Record<string, unknown>).flushRaf as () => void;
const MockResizeObserver = (globalThis as Record<string, unknown>).MockResizeObserver as {
  instances: Array<{
    triggerResize: (entries: ResizeObserverEntry[]) => void;
    observedTargets: Map<Element, ResizeObserverOptions>;
  }>;
  findObserverFor: (el: Element) =>
    | {
        triggerResize: (entries: ResizeObserverEntry[]) => void;
        observedTargets: Map<Element, ResizeObserverOptions>;
      }
    | undefined;
  createEntry: (target: Element, width: number, height: number) => ResizeObserverEntry;
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

    // Trigger resize on el1
    const observer1 = MockResizeObserver.findObserverFor(el1);
    if (observer1) {
      const entry = MockResizeObserver.createEntry(el1, 400, 300);
      act(() => {
        observer1.triggerResize([entry]);
        flushRaf();
      });
    }

    expect(result.current.get(el1)?.width).toBe(400);
    expect(result.current.get(el1)?.height).toBe(300);

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

    const observer = MockResizeObserver.findObserverFor(el);
    if (observer) {
      const entry = MockResizeObserver.createEntry(el, 200, 100);
      act(() => {
        observer.triggerResize([entry]);
        flushRaf();
      });
    }

    expect(result.current.size).toBe(1);
    expect(result.current.get(el)?.width).toBe(200);

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

    const observer = MockResizeObserver.findObserverFor(el);
    if (observer) {
      const entry: ResizeObserverEntry = {
        target: el,
        contentRect: new DOMRectReadOnly(0, 0, 0, 0),
        borderBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
        contentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
        devicePixelContentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
      };
      act(() => {
        observer.triggerResize([entry]);
        flushRaf();
      });
    }

    expect(result.current.get(el)?.width).toBe(0);
    expect(result.current.get(el)?.height).toBe(0);

    document.body.removeChild(el);
  });

  it('should accept box model option', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const ref = { current: el };

    const { result } = renderHook(() =>
      useResizeObserverEntries([ref as React.RefObject<HTMLDivElement | null>], {
        box: 'border-box',
      }),
    );

    const observer = MockResizeObserver.findObserverFor(el);
    if (observer) {
      const entry = MockResizeObserver.createEntry(el, 500, 400);
      act(() => {
        observer.triggerResize([entry]);
        flushRaf();
      });
    }

    expect(result.current.get(el)?.width).toBe(500);
    document.body.removeChild(el);
  });
});
