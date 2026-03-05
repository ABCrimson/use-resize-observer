import { render } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { useResizeObserverEntries } from '../../src/hook-multi.js';

const MultiComponent = () => {
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const entries = useResizeObserverEntries([ref1, ref2]);

  return (
    <div>
      <div ref={ref1} style={{ width: '100px', height: '50px' }} data-testid="multi-1">
        {entries.get(ref1.current!) ? 'observed' : 'pending'}
      </div>
      <div ref={ref2} style={{ width: '200px', height: '100px' }} data-testid="multi-2">
        {entries.get(ref2.current!) ? 'observed' : 'pending'}
      </div>
    </div>
  );
};

describe('useResizeObserverEntries (browser)', () => {
  it('should render multiple observed elements', () => {
    const { getByTestId } = render(<MultiComponent />);
    expect(getByTestId('multi-1')).toBeDefined();
    expect(getByTestId('multi-2')).toBeDefined();
  });
});
