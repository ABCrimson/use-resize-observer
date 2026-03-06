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
      const entry = MockResizeObserver.createEntry(el, 320, 240);
      act(() => {
        observer.triggerResize([entry]);
        flushRaf();
      });
    }

    expect(result.current.width).toBe(320);
    expect(result.current.height).toBe(240);
    expect(result.current.entry).toBeDefined();

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

    const observer = MockResizeObserver.findObserverFor(el);
    if (observer) {
      const entry = MockResizeObserver.createEntry(el, 400, 300);
      act(() => {
        observer.triggerResize([entry]);
        flushRaf();
      });
    }

    expect(onResize).toHaveBeenCalledOnce();
    expect(onResize.mock.calls[0]![0].target).toBe(el);

    document.body.removeChild(el);
  });

  it('should default to content-box dimensions', () => {
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
      const entry = MockResizeObserver.createEntry(el, 256, 128);
      act(() => {
        observer.triggerResize([entry]);
        flushRaf();
      });
    }

    expect(result.current.width).toBe(256);
    expect(result.current.height).toBe(128);

    document.body.removeChild(el);
  });
});
