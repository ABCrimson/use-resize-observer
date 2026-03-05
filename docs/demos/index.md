---
layout: doc
---

# Demos

Interactive demonstrations of `@crimson_dev/use-resize-observer` capabilities.

## Resize Visualizer

The resize visualizer shows real-time measurements from all three box models as you resize an element.

[Open Visualizer](/demos/visualizer/)

### Features

- **Real-time bar chart** — GPU-composited CSS `transform: scaleX()` animations
- **FPS counter** — Live frame rate display
- **Main/Worker toggle** — Switch between main-thread and Worker mode
- **View Transitions** — Smooth panel state changes via the View Transitions API
- **Box model comparison** — Side-by-side `contentBoxSize` vs `borderBoxSize` values

### GPU Acceleration

The visualizer uses several GPU-acceleration strategies:

| Technique | Purpose |
|-----------|---------|
| `will-change: transform` | Promotes bars to compositor layer |
| `transform: scaleX()` | Zero-layout-cost bar resizing |
| `OffscreenCanvas` | Worker-rendered heatmap overlay |
| `CSS.paintWorklet` | Compositor-thread mesh gradient |
| View Transitions API | Hardware-interpolated state changes |

### Accessibility

- All animations respect `prefers-reduced-motion: reduce`
- ARIA live regions announce dimension changes to screen readers
- Keyboard-navigable mode toggle
- WCAG 2.2 Level AA color contrast in OKLCH

## More Demos

::: tip Coming Soon
Additional demos will be added in future versions:
- Virtual list row measurement
- Responsive typography scaling
- Chart canvas auto-sizing
- Shadow DOM component resize tracking
:::
