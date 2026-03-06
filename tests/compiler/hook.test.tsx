import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResizeObserver } from '../../src/hook.js';

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

describe('useResizeObserver under React Compiler', () => {
  it('should work with compiler transformation', () => {
    const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());
    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
  });

  it('should update dimensions after resize under compiler', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    const { result } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
      }),
    );

    const observer = MockResizeObserver.findObserverFor(el);
    if (observer) {
      const entry = MockResizeObserver.createEntry(el, 500, 300);
      act(() => {
        observer.triggerResize([entry]);
        flushRaf();
      });
    }

    expect(result.current.width).toBe(500);
    expect(result.current.height).toBe(300);

    document.body.removeChild(el);
  });

  it('should use latest onResize without re-subscribing under compiler', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };
    const onResize1 = vi.fn();
    const onResize2 = vi.fn();

    const { rerender } = renderHook(
      ({ onResize }) =>
        useResizeObserver<HTMLDivElement>({
          ref: externalRef as React.RefObject<HTMLDivElement | null>,
          onResize,
        }),
      { initialProps: { onResize: onResize1 } },
    );

    rerender({ onResize: onResize2 });

    const observer = MockResizeObserver.findObserverFor(el);
    if (observer) {
      act(() => {
        observer.triggerResize([MockResizeObserver.createEntry(el, 200, 150)]);
        flushRaf();
      });
    }

    expect(onResize2).toHaveBeenCalledOnce();
    expect(onResize1).not.toHaveBeenCalled();

    document.body.removeChild(el);
  });
});
