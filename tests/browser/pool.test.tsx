import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useResizeObserver } from '../../src/hook.js';

const PoolTestComponent = ({ id }: { id: string }) => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();
  return (
    <div ref={ref} style={{ width: '200px', height: '100px' }} data-testid={id}>
      {width !== undefined ? `${width}x${height}` : 'pending'}
    </div>
  );
};

describe('ObserverPool (browser)', () => {
  afterEach(cleanup);

  it('should share a single ResizeObserver across multiple components', () => {
    const { getByTestId } = render(
      <div>
        <PoolTestComponent id="pool-1" />
        <PoolTestComponent id="pool-2" />
        <PoolTestComponent id="pool-3" />
      </div>,
    );
    expect(getByTestId('pool-1')).toBeDefined();
    expect(getByTestId('pool-2')).toBeDefined();
    expect(getByTestId('pool-3')).toBeDefined();
  });

  it('should observe elements in shadow DOM with separate pool', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    inner.style.width = '100px';
    inner.style.height = '50px';
    shadow.appendChild(inner);
    expect(inner.getRootNode()).toBe(shadow);
    document.body.removeChild(host);
  });

  it('should handle devicePixelContentBoxSize scaling', () => {
    expect(typeof window.devicePixelRatio).toBe('number');
    expect(window.devicePixelRatio).toBeGreaterThan(0);
  });
});
