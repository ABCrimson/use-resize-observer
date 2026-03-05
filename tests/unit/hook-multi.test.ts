import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useResizeObserverEntries } from '../../src/hook-multi.js';

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
    expect(result.current.size).toBe(0); // No elements attached yet
  });
});
