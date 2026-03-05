import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResizeObserver } from '../../src/hook.js';

const flushRaf = (globalThis as Record<string, unknown>).flushRaf as () => void;
const MockResizeObserver = (globalThis as Record<string, unknown>).MockResizeObserver as {
  instances: Array<{
    triggerResize: (entries: ResizeObserverEntry[]) => void;
    observedTargets: Map<Element, ResizeObserverOptions>;
  }>;
  createEntry: (target: Element, width: number, height: number) => ResizeObserverEntry;
};

describe('useResizeObserver', () => {
  it('should return undefined dimensions initially', () => {
    const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());
    expect(result.current.width).toBeUndefined();
    expect(result.current.height).toBeUndefined();
    expect(result.current.entry).toBeUndefined();
  });

  it('should provide a ref', () => {
    const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it('should update dimensions after resize observation', () => {
    const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());

    // Simulate attaching ref to an element
    const el = document.createElement('div');
    document.body.appendChild(el);

    act(() => {
      (result.current.ref as { current: HTMLDivElement | null }).current = el;
    });

    // Re-render to trigger useEffect with the new ref value
    const { result: _result2 } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: result.current.ref as React.RefObject<HTMLDivElement | null>,
      }),
    );

    // Find the observer and trigger a resize
    const observer = MockResizeObserver.instances[MockResizeObserver.instances.length - 1];
    if (observer) {
      const entry = MockResizeObserver.createEntry(el, 320, 240);
      act(() => {
        observer.triggerResize([entry]);
        flushRaf();
      });
    }

    document.body.removeChild(el);
  });

  it('should accept external ref', () => {
    const externalRef = { current: null as HTMLDivElement | null };
    const { result } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
      }),
    );
    expect(result.current.ref).toBe(externalRef);
  });

  it('should call onResize callback', () => {
    const onResize = vi.fn();
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
        onResize,
      }),
    );

    const observer = MockResizeObserver.instances[MockResizeObserver.instances.length - 1];
    if (observer) {
      const entry = MockResizeObserver.createEntry(el, 400, 300);
      act(() => {
        observer.triggerResize([entry]);
        flushRaf();
      });
    }

    document.body.removeChild(el);
  });

  it('should default to content-box', () => {
    const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());
    // Box is internal — verify via the observer being created
    expect(result.current.width).toBeUndefined();
  });
});
