---
layout: doc
---

# Demos

Demonstrations of `@crimson_dev/use-resize-observer` capabilities.

## Resize Visualizer

The resize visualizer shows real-time `contentBoxSize` and `borderBoxSize` measurements as you resize an element.

[Read the Visualizer walkthrough](/demos/visualizer/)

::: info Reference component
The visualizer ships as a React reference component at [`docs/.vitepress/theme/components/ResizeVisualizer.tsx`](https://github.com/ABCrimson/use-resize-observer/blob/main/docs/.vitepress/theme/components/ResizeVisualizer.tsx). VitePress renders pages with Vue, so the component is not mounted as a live island on this site — drop it into any React 19.3+ app to run it, or follow the [walkthrough](/demos/visualizer/) for an annotated tour.
:::

### Features

- **Real-time bar chart** — GPU-composited CSS `transform: scaleX()` animations
- **FPS counter** — live frame-rate readout driven by a `requestAnimationFrame` loop
- **Main/Worker mode toggle** — panel state switch animated via the View Transitions API
- **Box model comparison** — side-by-side `contentBoxSize` vs `borderBoxSize` bars

### GPU Acceleration

The visualizer uses these GPU-acceleration strategies:

| Technique | Purpose |
|-----------|---------|
| `will-change: transform` | Promotes bars to a compositor layer |
| `transform: scaleX()` | Zero-layout-cost bar resizing |
| View Transitions API | Hardware-interpolated state changes |

### Accessibility

- All animations — including the `.resize-bar` transitions — are disabled under `prefers-reduced-motion: reduce` via the theme's universal reduced-motion reset
- The mode toggle is a native `<button>`, keyboard-operable out of the box
- Colors come from the theme's OKLCH token palette

## More Demos

Copy-paste-ready examples for these scenarios already live in the [Examples guide](/guide/examples):

- Virtual list row measurement
- Responsive typography scaling
- Canvas auto-sizing with `device-pixel-content-box`
- Multi-element dashboards via `useResizeObserverEntries`

::: tip Coming Soon
Future versions will mount interactive versions of these examples directly on this page.
:::
