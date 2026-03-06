import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ResizeObserverContext, useResizeObserverConstructor } from '../../src/context.js';

describe('ResizeObserverContext', () => {
  it('should have a displayName', () => {
    expect(ResizeObserverContext.displayName).toBe('ResizeObserverContext');
  });

  it('should default to null', () => {
    // The context default is null
    const { result } = renderHook(() => useResizeObserverConstructor());
    // Falls back to globalThis.ResizeObserver when context is null
    expect(result.current).toBe(globalThis.ResizeObserver);
  });
});

describe('useResizeObserverConstructor', () => {
  it('should return globalThis.ResizeObserver when no provider', () => {
    const { result } = renderHook(() => useResizeObserverConstructor());
    expect(result.current).toBe(globalThis.ResizeObserver);
  });

  it('should return custom constructor from context', () => {
    const CustomRO = vi.fn() as unknown as typeof ResizeObserver;
    const { result } = renderHook(() => useResizeObserverConstructor(), {
      wrapper: ({ children }) =>
        React.createElement(ResizeObserverContext.Provider, { value: CustomRO }, children),
    });
    expect(result.current).toBe(CustomRO);
  });
});
