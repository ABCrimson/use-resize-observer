import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useResizeObserver } from '../../src/hook.js';

const BoxModelComponent = ({
  box,
}: {
  box: 'content-box' | 'border-box' | 'device-pixel-content-box';
}) => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>({ box });
  return (
    <div
      ref={ref}
      style={{ width: '200px', height: '100px', padding: '10px', border: '5px solid black' }}
      data-testid="box-test"
    >
      {width !== undefined ? `${width}x${height}` : 'loading'}
    </div>
  );
};

describe('Box model options (browser)', () => {
  afterEach(cleanup);
  it('should render with content-box', () => {
    const { getByTestId } = render(<BoxModelComponent box="content-box" />);
    expect(getByTestId('box-test')).toBeDefined();
  });

  it('should render with border-box', () => {
    const { getByTestId } = render(<BoxModelComponent box="border-box" />);
    expect(getByTestId('box-test')).toBeDefined();
  });

  it.skipIf(
    (() => {
      try {
        const ro = new ResizeObserver(() => {});
        const el = document.createElement('div');
        ro.observe(el, { box: 'device-pixel-content-box' });
        ro.disconnect();
        return false;
      } catch {
        return true;
      }
    })(),
  )('should render with device-pixel-content-box', () => {
    const { getByTestId } = render(<BoxModelComponent box="device-pixel-content-box" />);
    expect(getByTestId('box-test')).toBeDefined();
  });
});
