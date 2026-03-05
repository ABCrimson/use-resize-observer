import { describe, expect, it } from 'vitest';
import { createServerResizeObserverMock, isResizeObserverSupported } from '../../src/server.js';

describe('createServerResizeObserverMock', () => {
  it('should return undefined dimensions', () => {
    const mock = createServerResizeObserverMock();
    expect(mock.width).toBeUndefined();
    expect(mock.height).toBeUndefined();
    expect(mock.entry).toBeUndefined();
  });

  it('should return a ref with null current', () => {
    const mock = createServerResizeObserverMock();
    expect(mock.ref.current).toBeNull();
  });

  it('should be generic-typed', () => {
    const mock = createServerResizeObserverMock<HTMLDivElement>();
    expect(mock.ref.current).toBeNull();
  });
});

describe('isResizeObserverSupported', () => {
  it('should return a boolean', () => {
    const result = isResizeObserverSupported();
    expect(typeof result).toBe('boolean');
  });
});
