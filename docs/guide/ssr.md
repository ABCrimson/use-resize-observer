# SSR & React Server Components

`@crimson_dev/use-resize-observer` is safe for SSR and RSC environments out of the box.

## The Problem

`ResizeObserver` is a browser API -- it does not exist in Node.js or edge runtimes. Naively importing a ResizeObserver hook in an SSR context causes `ReferenceError: ResizeObserver is not defined`.

## Solution: `'use client'` Boundary

The main hook entry includes `'use client'` at the top. This tells React Server Components that this module must run on the client:

```tsx
// This file has 'use client' — safe to import in RSC trees
import { useResizeObserver } from '@crimson_dev/use-resize-observer';
```

React will automatically create a client boundary at the import point. No additional configuration is needed.

::: warning Server Component imports
If you import the hook directly inside a Server Component (without a client component boundary), React will throw a clear error about violating the `'use client'` boundary. You will not see a cryptic hook error.
:::

## Next.js App Router Integration

The recommended pattern with Next.js App Router:

```tsx
// app/components/ResizablePanel.tsx
'use client';

import { useResizeObserver } from '@crimson_dev/use-resize-observer';

export const ResizablePanel = () => {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  return (
    <div ref={ref} className="panel">
      {width !== undefined ? `${width}x${height}` : 'Measuring...'}
    </div>
  );
};
```

```tsx
// app/page.tsx — Server Component (default in App Router)
import { ResizablePanel } from './components/ResizablePanel';

export default function Page() {
  return (
    <main>
      <h1>Dashboard</h1>
      <ResizablePanel /> {/* Client component boundary */}
    </main>
  );
}
```

## Server Mock

For SSR frameworks that pre-render component trees on the server, use the `/server` entry to get a type-safe mock:

```tsx
import { createServerResizeObserverMock } from '@crimson_dev/use-resize-observer/server';

// Returns { ref: { current: null }, width: undefined, height: undefined, entry: undefined }
const mockResult = createServerResizeObserverMock<HTMLDivElement>();
```

The mock returns `undefined` for all dimensions, matching the hook's initial state before the first measurement. This ensures your components render consistently between server and client on the initial pass.

::: tip Avoiding layout shift
You can spread the mock result and override dimensions to approximate the expected client size, reducing Cumulative Layout Shift (CLS):

```tsx
const result = { ...createServerResizeObserverMock<HTMLDivElement>(), width: 1024, height: 768 };
```
:::

## Environment Detection

```tsx
import { isResizeObserverSupported } from '@crimson_dev/use-resize-observer/server';

if (isResizeObserverSupported()) {
  // Browser — safe to use the real hook
} else {
  // Server — use mock or conditionally render
}
```

## Remix / React Router Integration

```tsx
// app/components/ResponsiveChart.tsx
'use client';

import { useResizeObserver } from '@crimson_dev/use-resize-observer';

export function ResponsiveChart() {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  return (
    <div ref={ref} style={{ width: '100%', minHeight: 300 }}>
      {width !== undefined && height !== undefined ? (
        <svg viewBox={`0 0 ${width} ${height}`}>
          {/* Chart content */}
        </svg>
      ) : (
        <div style={{ height: 300 }}>Loading chart...</div>
      )}
    </div>
  );
}
```

## Astro Integration

With Astro's island architecture, the hook works inside any React island:

```astro
---
// src/pages/index.astro
import ResizableWidget from '../components/ResizableWidget.tsx';
---

<html>
  <body>
    <ResizableWidget client:visible />
  </body>
</html>
```

```tsx
// src/components/ResizableWidget.tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

export default function ResizableWidget() {
  const { ref, width } = useResizeObserver<HTMLDivElement>();
  return <div ref={ref}>{width ?? 'Hydrating...'}px wide</div>;
}
```

## ResizeObserverContext for Testing

Use `ResizeObserverContext` to inject a mock `ResizeObserver` in test environments:

```tsx
import { ResizeObserverContext } from '@crimson_dev/use-resize-observer';

const MockResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ResizeObserverContext.Provider value={MockResizeObserver}>
    {children}
  </ResizeObserverContext.Provider>
);

// In your test
import { render } from '@testing-library/react';

test('renders without ResizeObserver', () => {
  const { getByText } = render(
    <TestWrapper>
      <MyComponent />
    </TestWrapper>
  );
  expect(getByText('Measuring...')).toBeDefined();
});
```

## Vitest / Jest Configuration

Most test runners do not provide `ResizeObserver` globally. You have two options:

### Option 1: Global mock

```typescript
// vitest.setup.ts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
```

### Option 2: Context injection (recommended)

Use `ResizeObserverContext` as shown above. This is more explicit and does not pollute the global scope.

## Worker Mode and SSR

The worker hook (`useResizeObserverWorker`) is browser-only. The `/worker` entry includes `'use client'` and should only be used in client components:

```tsx
'use client';

import { useResizeObserverWorker } from '@crimson_dev/use-resize-observer/worker';

// Safe: this module is client-only via 'use client'
const MyWorkerComponent = () => {
  const { ref, width, height } = useResizeObserverWorker<HTMLDivElement>();
  return <div ref={ref}>{width} x {height}</div>;
};
```

## Next Steps

- [React Compiler](/guide/compiler) -- Compiler compatibility with SSR
- [Troubleshooting](/guide/troubleshooting) -- Common SSR issues and fixes
- [Advanced API](/guide/advanced) -- `ResizeObserverContext` deep dive
