import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ResizeObserverContext } from '../../src/context.js';
import { useResizeObserver } from '../../src/hook.js';

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

    const observer = findObserverOrThrow(el);
    const entry = MockResizeObserver.createEntry(el, 320, 240);
    act(() => {
      observer.triggerResize([entry]);
      flushRaf();
    });

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

    const observer = findObserverOrThrow(el);
    const entry = MockResizeObserver.createEntry(el, 400, 300);
    act(() => {
      observer.triggerResize([entry]);
      flushRaf();
    });

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

    const observer = findObserverOrThrow(el);
    const entry = MockResizeObserver.createEntry(el, 256, 128);
    act(() => {
      observer.triggerResize([entry]);
      flushRaf();
    });

    expect(result.current.width).toBe(256);
    expect(result.current.height).toBe(128);

    document.body.removeChild(el);
  });

  it('should use custom ResizeObserver from context', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    // Create a genuinely different constructor — a subclass of the mock
    // so it's !== globalThis.ResizeObserver and triggers the isCustomCtor branch
    const BaseMock = (globalThis as Record<string, unknown>).MockResizeObserver as {
      new (cb: ResizeObserverCallback): ResizeObserver;
    };
    const CustomRO = class extends BaseMock {} as unknown as typeof ResizeObserver;

    const { result } = renderHook(
      () =>
        useResizeObserver<HTMLDivElement>({
          ref: externalRef as React.RefObject<HTMLDivElement | null>,
        }),
      {
        wrapper: ({ children }) =>
          React.createElement(ResizeObserverContext.Provider, { value: CustomRO }, children),
      },
    );

    // The hook should have observed the element via the custom constructor
    const observer = findObserverOrThrow(el);
    const entry = MockResizeObserver.createEntry(el, 500, 300);
    act(() => {
      observer.triggerResize([entry]);
      flushRaf();
    });

    expect(result.current.width).toBe(500);
    expect(result.current.height).toBe(300);
    expect(result.current.ref.current).toBe(el);

    document.body.removeChild(el);
  });

  it('should handle entries with empty size arrays', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const externalRef = { current: el };

    const { result } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
      }),
    );

    const observer = findObserverOrThrow(el);
    // Create an entry with empty size arrays — triggers the ?? 0 fallback
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

    expect(result.current.width).toBe(0);
    expect(result.current.height).toBe(0);
    expect(result.current.entry).toBeDefined();

    document.body.removeChild(el);
  });

  it('should accept a custom root option', () => {
    const el = document.createElement('div');
    const shadow = document.createElement('div').attachShadow({ mode: 'open' });
    shadow.appendChild(el);

    const externalRef = { current: el };

    const { result } = renderHook(() =>
      useResizeObserver<HTMLDivElement>({
        ref: externalRef as React.RefObject<HTMLDivElement | null>,
        root: shadow,
      }),
    );

    const observer = findObserverOrThrow(el);
    const entry = MockResizeObserver.createEntry(el, 400, 200);
    act(() => {
      observer.triggerResize([entry]);
      flushRaf();
    });

    expect(result.current.width).toBe(400);
    expect(result.current.height).toBe(200);
  });
});
