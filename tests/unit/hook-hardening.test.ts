import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResizeObserver } from '../../src/hook.js';

const flushRaf = (globalThis as Record<string, unknown>).flushRaf as () => void;
const MockResizeObserver = (globalThis as Record<string, unknown>).MockResizeObserver as {
  instances: Array<{
    triggerResize: (entries: ResizeObserverEntry[]) => void;
    observedTargets: Map<Element, ResizeObserverOptions>;
  }>;
  allInstances: Array<{
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

/** Helper: trigger resize on the observer watching the given element. */
const triggerResizeOn = (el: Element, width: number, height: number): void => {
  const observer = MockResizeObserver.findObserverFor(el);
  if (!observer) throw new Error('No observer found for element');
  const entry = MockResizeObserver.createEntry(el, width, height);
  observer.triggerResize([entry]);
};

describe('useResizeObserver — hardening', () => {
  it('should re-observe when box model changes', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    const { rerender } = renderHook(
      ({ box }) =>
        useResizeObserver<HTMLDivElement>({
          ref: externalRef as React.RefObject<HTMLDivElement | null>,
          box,
        }),
      { initialProps: { box: 'content-box' as const } },
    );

    // Change box model — effect should re-run since box is now in deps
    rerender({ box: 'border-box' as const });

    // Element should still be observed
    const observer = MockResizeObserver.findObserverFor(el);
    expect(observer).toBeDefined();

    document.body.removeChild(el);
  });

  it('should read latest box from ref in callback after box change', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    const { result, rerender } = renderHook(
      ({ box }) =>
        useResizeObserver<HTMLDivElement>({
          ref: externalRef as React.RefObject<HTMLDivElement | null>,
          box,
        }),
      { initialProps: { box: 'content-box' as const } },
    );

    // Switch to border-box — effect re-runs, new callback created
    rerender({ box: 'border-box' as const });

    act(() => {
      triggerResizeOn(el, 500, 400);
      flushRaf();
    });

    expect(result.current.width).toBe(500);
    expect(result.current.height).toBe(400);

    document.body.removeChild(el);
  });

  it('should handle null ref gracefully', () => {
    const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());

    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
    expect(result.current.ref.current).toBeNull();
  });

  it('should not call onResize when ref is null', () => {
    const onResize = vi.fn();
    renderHook(() => useResizeObserver<HTMLDivElement>({ onResize }));

    flushRaf();
    expect(onResize).not.toHaveBeenCalled();
  });

  it('should use latest onResize callback without re-subscribing', () => {
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

    // Change onResize — should NOT cause re-subscription (not in deps)
    rerender({ onResize: onResize2 });

    act(() => {
      triggerResizeOn(el, 200, 150);
      flushRaf();
    });

    expect(onResize2).toHaveBeenCalledOnce();
    expect(onResize1).not.toHaveBeenCalled();

    document.body.removeChild(el);
  });

  it('should handle rapid sequential resizes (last-write-wins)', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    const { result } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
      }),
    );

    act(() => {
      triggerResizeOn(el, 100, 50);
      triggerResizeOn(el, 200, 100);
      triggerResizeOn(el, 300, 150);
      flushRaf();
    });

    // Last value wins via scheduler deduplication
    expect(result.current.width).toBe(300);
    expect(result.current.height).toBe(150);

    document.body.removeChild(el);
  });

  it('should expose the raw ResizeObserverEntry', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    const { result } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
      }),
    );

    act(() => {
      triggerResizeOn(el, 640, 480);
      flushRaf();
    });

    expect(result.current.entry).toBeDefined();
    expect(result.current.entry?.target).toBe(el);

    document.body.removeChild(el);
  });

  it('should extract device-pixel-content-box dimensions', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    const { result } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
        box: 'device-pixel-content-box',
      }),
    );

    act(() => {
      triggerResizeOn(el, 320, 240);
      flushRaf();
    });

    // devicePixelContentBoxSize uses dpr multiplier (default 1)
    expect(result.current.width).toBe(320);
    expect(result.current.height).toBe(240);

    document.body.removeChild(el);
  });

  it('should extract border-box dimensions', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    const { result } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
        box: 'border-box',
      }),
    );

    act(() => {
      triggerResizeOn(el, 800, 600);
      flushRaf();
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);

    document.body.removeChild(el);
  });

  it('should clean up on unmount', () => {
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

    // After unmount, observer should have unobserved the element
    const observer = MockResizeObserver.findObserverFor(el);
    expect(observer).toBeUndefined();

    document.body.removeChild(el);
  });

  it('should return same ref identity when using internal ref', () => {
    const { result, rerender } = renderHook(() => useResizeObserver<HTMLDivElement>());

    const firstRef = result.current.ref;
    rerender();
    expect(result.current.ref).toBe(firstRef);
  });
});
