import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
