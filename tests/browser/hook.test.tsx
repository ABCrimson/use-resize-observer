import { cleanup, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useResizeObserver } from '../../src/hook.js';

const TestComponent = () => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();
  return (
    <div ref={ref} style={{ width: '200px', height: '150px' }} data-testid="observed">
      {width !== undefined ? `${width}x${height}` : 'loading'}
    </div>
  );
};

const ExternalRefComponent = () => {
  const myRef = useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver<HTMLDivElement>({ ref: myRef });
  return (
    <div ref={myRef} style={{ width: '300px', height: '200px' }} data-testid="external">
      {width !== undefined ? `${width}x${height}` : 'loading'}
    </div>
  );
};

describe('useResizeObserver (browser)', () => {
  afterEach(cleanup);

  it('should render without errors', () => {
    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('observed')).toBeDefined();
  });

  it('should initially show loading', () => {
    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('observed').textContent).toBe('loading');
  });

  it('should work with external ref', () => {
    const { getByTestId } = render(<ExternalRefComponent />);
    expect(getByTestId('external')).toBeDefined();
  });
});
