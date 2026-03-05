---
layout: doc
---

# Resize Visualizer

An interactive demo showing `@crimson_dev/use-resize-observer` in action with real-time bar charts and dimension readouts.

## Live Demo

Drag the bottom-right corner of the box below to resize it. The bar chart updates in real time using GPU-composited CSS `transform: scaleX()` animations.

<script setup>
// VitePress 2 client-side island component
// The ResizeVisualizer is imported as a Vue/React component island
</script>

::: tip Interactive
The element below has `resize: both` CSS -- drag the handle to see real-time dimension tracking.
:::

<div style="resize: both; overflow: auto; min-width: 200px; min-height: 150px; max-width: 100%; padding: 24px; border: 2px dashed oklch(52% 0.26 11 / 0.3); border-radius: 12px; background: oklch(17% 0.02 11); font-family: 'Geist Mono', monospace; color: oklch(94% 0.01 11);">
  Resize this element to see the observer in action.
  <br /><br />
  In the full app, a React component renders here with live bar charts and an FPS counter.
</div>

## Features Demonstrated

### GPU-Accelerated Bar Chart

The dimension bars use `transform: scaleX()` for zero-layout-cost animation. The `will-change: transform` property promotes the bars to their own compositor layer, ensuring resizes never cause layout thrashing:

```css
.resize-bar {
  will-change: transform;
  transform-origin: left;
  transform: scaleX(var(--bar-scale));
  transition: transform 0.1s ease-out;
}
```

This pattern ensures that even rapid resizing (e.g., dragging a window edge) produces smooth 60fps animations without jank.

### FPS Counter

A `requestAnimationFrame` loop counts frames per second, demonstrating that resize tracking has negligible impact on frame rate:

```tsx
const useFPS = () => {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
};
```

### Main/Worker Toggle

Switch between main-thread and Worker mode to compare behavior:

| Mode | What Happens |
|------|-------------|
| **Main thread** | ResizeObserver callback runs on the main thread, measurements batched via rAF |
| **Worker mode** | Measurements written to `SharedArrayBuffer` by ResizeObserver, read by main thread in rAF loop |

Both modes produce identical visual output, but Worker mode keeps the main thread completely free of observer callbacks.

::: warning Worker mode requirements
Worker mode requires cross-origin isolation headers (COOP/COEP). The demo automatically detects whether `crossOriginIsolated` is available and disables the Worker toggle if not.
:::

### View Transitions

Panel state changes (toggling between modes, expanding settings) use the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) for smooth, hardware-accelerated transitions:

```tsx
const toggleMode = () => {
  if ('startViewTransition' in document) {
    document.startViewTransition(() => {
      setMode((prev) => (prev === 'main' ? 'worker' : 'main'));
    });
  } else {
    setMode((prev) => (prev === 'main' ? 'worker' : 'main'));
  }
};
```

## How It Works

```mermaid
graph LR
    A["User drags\nresize handle"] --> B["ResizeObserver\nfires"]
    B --> C["ObserverPool\nschedules"]
    C --> D["rAF batch\nflush"]
    D --> E["startTransition"]
    E --> F["setState\nwidth/height"]
    F --> G["CSS variable\nupdate"]
    G --> H["GPU composite\n(no layout)"]
```

### Key observations

1. **Single observer** -- The resizable div and the history tracker both share the same underlying `ResizeObserver` instance via the pool.

2. **GPU-composited bars** -- The `.resize-bar` class uses `will-change: transform` and CSS `transition` for smooth animations that run entirely on the compositor thread.

3. **rAF batching** -- Even when dragging the resize handle rapidly (producing many resize events per frame), measurements are coalesced into one update per animation frame.

4. **startTransition** -- The bar chart and dimension readouts update as a low-priority transition, so they never block user interaction with the resize handle.

## Visualizer Component

The core visualizer component tracks both live dimensions and a history buffer:

```tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';
import { useState } from 'react';

const ResizeVisualizer = () => {
  const [history, setHistory] = useState<Array<{ w: number; h: number; t: number }>>([]);

  const { ref, width, height } = useResizeObserver<HTMLDivElement>({
    onResize: (entry) => {
      const [cs] = entry.contentBoxSize;
      if (cs) {
        setHistory((prev) => [
          ...prev.slice(-19),
          { w: cs.inlineSize, h: cs.blockSize, t: Date.now() },
        ]);
      }
    },
  });

  return (
    <div>
      {/* Resizable target */}
      <div ref={ref} style={{ resize: 'both', overflow: 'auto', padding: 24 }}>
        {width !== undefined
          ? `${Math.round(width)} x ${Math.round(height!)}`
          : 'Drag to resize'}
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 120 }}>
        {history.map((entry, i) => {
          const maxW = Math.max(...history.map((e) => e.w), 1);
          return (
            <div
              key={entry.t}
              className="resize-bar"
              style={{
                flex: 1,
                height: `${(entry.w / maxW) * 100}%`,
                background: `oklch(45% 0.2 ${(i * 18) % 360})`,
                borderRadius: '2px 2px 0 0',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
```

## Box Model Comparison View

The visualizer can display all three box models simultaneously:

```tsx
const BoxModelVisualizer = () => {
  const ref = useRef<HTMLDivElement>(null);
  const content = useResizeObserver({ ref, box: 'content-box' });
  const border = useResizeObserver({ ref, box: 'border-box' });

  return (
    <div>
      <div ref={ref} style={{ resize: 'both', overflow: 'auto', padding: 20, border: '4px solid' }}>
        Resize me
      </div>
      <table>
        <thead><tr><th>Model</th><th>Width</th><th>Height</th></tr></thead>
        <tbody>
          <tr><td>content-box</td><td>{content.width?.toFixed(1)}</td><td>{content.height?.toFixed(1)}</td></tr>
          <tr><td>border-box</td><td>{border.width?.toFixed(1)}</td><td>{border.height?.toFixed(1)}</td></tr>
        </tbody>
      </table>
    </div>
  );
};
```

## Performance Metrics

With the Performance panel open in DevTools, you should observe:

| Metric | Expected Value |
|--------|---------------|
| Resize callbacks per frame | 1 (batched by pool) |
| React renders per frame | 1 (via startTransition) |
| Layout thrashing | None (read-only observation) |
| Paint regions | Bar chart + readout elements only |
| Compositor animations | Bar height/scale transitions |

## Try It Yourself

```bash
git clone https://github.com/crimson-dev/use-resize-observer.git
cd use-resize-observer
npm install
npm run docs:dev
```

Then navigate to `http://localhost:5173/use-resize-observer/demos/visualizer/`.

## Source Code

The full visualizer source is at [`docs/.vitepress/theme/components/ResizeVisualizer.tsx`](https://github.com/crimson-dev/use-resize-observer/blob/main/docs/.vitepress/theme/components/ResizeVisualizer.tsx).
