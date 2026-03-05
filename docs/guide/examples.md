# Examples

Copy-paste ready examples for common use cases. Each example is self-contained and can be dropped into any React 19.3+ project.

## 1. Basic Width/Height Tracking

The simplest use case: display an element's dimensions as it resizes.

```tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const SizeDisplay = () => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  return (
    <div ref={ref} style={{ resize: 'both', overflow: 'auto', padding: 16, border: '1px solid #333' }}>
      {width !== undefined ? `${Math.round(width)} x ${Math.round(height!)}` : 'Resize me!'}
    </div>
  );
};
```

## 2. Responsive Breakpoint Component

Switch between layouts based on container width, not viewport width:

```tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

type Layout = 'compact' | 'medium' | 'wide';

const getLayout = (width: number | undefined): Layout => {
  if (width === undefined || width < 480) return 'compact';
  if (width < 768) return 'medium';
  return 'wide';
};

const ResponsiveCard = () => {
  const { ref, width } = useResizeObserver<HTMLDivElement>();
  const layout = getLayout(width);

  return (
    <div ref={ref} className={`card card--${layout}`}>
      <div className="card-image" />
      <div className="card-content">
        <h3>Responsive Card</h3>
        <p>Current layout: {layout} ({width ? `${Math.round(width)}px` : 'measuring'})</p>
      </div>
    </div>
  );
};
```

## 3. Responsive Typography

Scale font size based on container width:

```tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const ResponsiveHeading = ({ children }: { children: React.ReactNode }) => {
  const { ref, width } = useResizeObserver<HTMLHeadingElement>();

  const fontSize = width !== undefined
    ? Math.max(16, Math.min(width / 10, 72))
    : 32;

  return (
    <h1 ref={ref} style={{ fontSize: `${fontSize}px`, transition: 'font-size 0.15s ease-out' }}>
      {children}
    </h1>
  );
};
```

## 4. Virtual List Row Height Measurement

Measure dynamic row heights for a virtual scrolling list:

```tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const MeasuredRow = ({
  index,
  onHeightChange,
  children,
}: {
  index: number;
  onHeightChange: (index: number, height: number) => void;
  children: React.ReactNode;
}) => {
  const { ref } = useResizeObserver<HTMLDivElement>({
    onResize: (entry) => {
      const [cs] = entry.contentBoxSize;
      if (cs) onHeightChange(index, cs.blockSize);
    },
  });

  return (
    <div ref={ref} style={{ padding: '8px 16px' }}>
      {children}
    </div>
  );
};
```

## 5. Canvas with Device Pixel Ratio

Render a pixel-perfect canvas that matches device pixel density:

```tsx
import { useRef, useEffect } from 'react';
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const PixelPerfectCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useResizeObserver({
    ref: canvasRef,
    box: 'device-pixel-content-box',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === undefined || height === undefined) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    const dpr = devicePixelRatio;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width / dpr, height / dpr);

    // Draw a grid
    ctx.strokeStyle = 'oklch(52% 0.26 11 / 0.3)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width / dpr; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height / dpr);
      ctx.stroke();
    }
    for (let y = 0; y < height / dpr; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width / dpr, y);
      ctx.stroke();
    }
  }, [width, height]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '300px' }} />;
};
```

## 6. Aspect Ratio Tracker

Track and display an element's aspect ratio:

```tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const AspectRatioDisplay = () => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  const ratio = width !== undefined && height !== undefined && height > 0
    ? (width / height).toFixed(2)
    : '...';

  const label = width !== undefined && height !== undefined && height > 0
    ? width > height ? 'Landscape' : width < height ? 'Portrait' : 'Square'
    : 'Measuring';

  return (
    <div ref={ref} style={{ resize: 'both', overflow: 'auto', padding: 24, border: '1px solid #444', minWidth: 100, minHeight: 100 }}>
      <p>Ratio: {ratio}</p>
      <p>Orientation: {label}</p>
      <p>Size: {width !== undefined ? `${Math.round(width)} x ${Math.round(height!)}` : '...'}</p>
    </div>
  );
};
```

## 7. Worker Mode Grid

100 simultaneously resizing elements using worker mode:

```tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';
import { createWorkerObserver } from '@crimson_dev/use-resize-observer/worker';

const workerObserver = createWorkerObserver({
  maxElements: 256,
  precision: 'float16',
});

const WorkerGrid = () => {
  const items = Array.from({ length: 100 }, (_, i) => i);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 4 }}>
      {items.map((i) => (
        <WorkerCell key={i} index={i} />
      ))}
    </div>
  );
};

const WorkerCell = ({ index }: { index: number }) => {
  const { ref, width } = useResizeObserver<HTMLDivElement>({
    observer: workerObserver,
  });

  const hue = ((index * 37) + (width ?? 0)) % 360;

  return (
    <div
      ref={ref}
      style={{
        aspectRatio: '1',
        background: `oklch(35% 0.15 ${hue})`,
        display: 'grid',
        placeItems: 'center',
        fontSize: '0.75rem',
        color: 'oklch(85% 0.02 0)',
      }}
    >
      {width !== undefined ? `${Math.round(width)}` : '...'}
    </div>
  );
};
```

## 8. Multi-Element Dashboard

Track multiple panels with a single hook:

```tsx
import { useRef } from 'react';
import { useResizeObserverEntries } from '@crimson_dev/use-resize-observer';

const Dashboard = () => {
  const sidebar = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLDivElement>(null);
  const footer = useRef<HTMLDivElement>(null);

  const entries = useResizeObserverEntries([sidebar, main, footer]);

  const sidebarWidth = entries.get(sidebar.current!)?.width;
  const mainWidth = entries.get(main.current!)?.width;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gridTemplateRows: '1fr auto', gap: 8, height: '100vh' }}>
      <div ref={sidebar} style={{ background: 'oklch(17% 0.02 11)', padding: 16 }}>
        Sidebar: {sidebarWidth ? `${Math.round(sidebarWidth)}px` : '...'}
      </div>
      <div ref={main} style={{ background: 'oklch(15% 0.02 11)', padding: 16 }}>
        Main: {mainWidth ? `${Math.round(mainWidth)}px` : '...'}
      </div>
      <div ref={footer} style={{ gridColumn: '1 / -1', background: 'oklch(17% 0.02 11)', padding: 16 }}>
        Footer: {entries.get(footer.current!)?.width ? `${Math.round(entries.get(footer.current!)!.width!)}px` : '...'}
      </div>
    </div>
  );
};
```

## 9. SSR-Safe Component

A component that works on both server and client:

```tsx
'use client';

import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const SSRSafeWidget = () => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  return (
    <div ref={ref} style={{ padding: 24, border: '1px solid #333' }}>
      {width !== undefined ? (
        <p>Measured: {Math.round(width)} x {Math.round(height!)}</p>
      ) : (
        <p>Server-rendered placeholder</p>
      )}
    </div>
  );
};

export default SSRSafeWidget;
```

## 10. Factory API in Vanilla JS

Use the observer pool without React:

```typescript
import { createResizeObserver } from '@crimson_dev/use-resize-observer';

const observer = createResizeObserver({ box: 'border-box' });

// Track all elements with a data attribute
document.querySelectorAll('[data-track-size]').forEach((el) => {
  observer.observe(el, (entry) => {
    const [bs] = entry.borderBoxSize;
    const width = bs?.inlineSize ?? 0;
    const height = bs?.blockSize ?? 0;

    el.setAttribute('data-width', String(Math.round(width)));
    el.setAttribute('data-height', String(Math.round(height)));

    // Update CSS custom properties for container-query-like behavior
    (el as HTMLElement).style.setProperty('--self-width', `${width}px`);
    (el as HTMLElement).style.setProperty('--self-height', `${height}px`);
  });
});

// Cleanup when done
observer.disconnect();
```

## 11. Conditional Observation

Start and stop observation based on component state:

```tsx
import { useRef, useState } from 'react';
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const ConditionalObserver = () => {
  const [tracking, setTracking] = useState(true);
  const divRef = useRef<HTMLDivElement>(null);

  const { width, height } = useResizeObserver({
    ref: tracking ? divRef : undefined,
  });

  return (
    <div>
      <button onClick={() => setTracking(!tracking)}>
        {tracking ? 'Stop tracking' : 'Start tracking'}
      </button>
      <div ref={divRef} style={{ resize: 'both', overflow: 'auto', padding: 16, border: '1px solid #333' }}>
        {tracking
          ? `Tracking: ${width ?? '...'} x ${height ?? '...'}`
          : 'Not tracking'}
      </div>
    </div>
  );
};
```

## 12. Border-Box vs Content-Box Comparison

Observe the same element with both box models:

```tsx
import { useRef } from 'react';
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const BoxModelComparison = () => {
  const ref = useRef<HTMLDivElement>(null);

  const content = useResizeObserver({ ref, box: 'content-box' });
  const border = useResizeObserver({ ref, box: 'border-box' });

  return (
    <div
      ref={ref}
      style={{
        resize: 'both',
        overflow: 'auto',
        padding: 24,
        border: '4px solid oklch(52% 0.26 11)',
        minWidth: 200,
        minHeight: 100,
      }}
    >
      <table>
        <thead>
          <tr><th>Box Model</th><th>Width</th><th>Height</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>content-box</td>
            <td>{content.width?.toFixed(1) ?? '...'}</td>
            <td>{content.height?.toFixed(1) ?? '...'}</td>
          </tr>
          <tr>
            <td>border-box</td>
            <td>{border.width?.toFixed(1) ?? '...'}</td>
            <td>{border.height?.toFixed(1) ?? '...'}</td>
          </tr>
          <tr>
            <td>Difference (padding + border)</td>
            <td>{content.width !== undefined && border.width !== undefined ? (border.width - content.width).toFixed(1) : '...'}</td>
            <td>{content.height !== undefined && border.height !== undefined ? (border.height - content.height).toFixed(1) : '...'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
```
