# Getting Started

## Installation

```bash
npm install @crimson_dev/use-resize-observer
```

::: tip React 19 Required
This library requires React 19.3.0 or later. It uses React 19's automatic batching and startTransition for optimal performance.
:::

## Quick Start

```tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const MyComponent = () => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  return (
    <div ref={ref}>
      {width !== undefined && height !== undefined
        ? `${Math.round(width)} x ${Math.round(height)}`
        : 'Measuring...'}
    </div>
  );
};
```

## What You Get

| Feature | Value |
|---------|-------|
| Bundle size | < 300B min+gzip |
| Runtime dependencies | 0 |
| React version | >= 19.3.0 |
| Module format | ESM only |
| TypeScript | 6.0+ strict |
| Box models | content-box, border-box, device-pixel-content-box |
| Worker mode | SharedArrayBuffer + Float16Array |
| SSR/RSC | Safe with server entry |

## With External Ref

```tsx
import { useRef } from 'react';
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const MyComponent = () => {
  const myRef = useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver({ ref: myRef });

  return <div ref={myRef}>{width} x {height}</div>;
};
```

## With Callback

```tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const MyComponent = () => {
  const { ref } = useResizeObserver<HTMLDivElement>({
    onResize: (entry) => {
      console.log('Resized:', entry.contentRect);
    },
  });

  return <div ref={ref}>Resize me</div>;
};
```

## Next Steps

- [Architecture](/guide/architecture) — How the shared pool works
- [Box Models](/guide/box-models) — content-box vs border-box vs device-pixel-content-box
- [Worker Mode](/guide/worker) — Move measurements off the main thread
- [SSR & RSC](/guide/ssr) — Server-side rendering support
