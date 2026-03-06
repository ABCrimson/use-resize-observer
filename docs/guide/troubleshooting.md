# Troubleshooting

Common issues and solutions when using `@crimson_dev/use-resize-observer`.

## Width and Height Are Always `undefined`

### The ref is not attached

The most common cause is that the `ref` returned by the hook is not attached to a DOM element.

```tsx
// BUG: ref is not used
const { ref, width } = useResizeObserver<HTMLDivElement>();
return <div>{width}</div>; // width is always undefined

// FIX: attach the ref
const { ref, width } = useResizeObserver<HTMLDivElement>();
return <div ref={ref}>{width}</div>;
```

### The element is not rendered

If the element is conditionally rendered and not currently in the DOM, the observer has nothing to observe:

```tsx
// The observer only works when showPanel is true
const { ref, width } = useResizeObserver<HTMLDivElement>();
return showPanel ? <div ref={ref}>{width}</div> : null;
```

::: tip
Consider using the `onResize` callback pattern if you need to handle the case where the element might not be mounted initially. The callback will fire as soon as the element appears in the DOM.
:::

### The element has `display: none` or `display: inline`

`ResizeObserver` does not report dimensions for elements with `display: none`. Inline elements (`display: inline`) also do not generate resize observations. Ensure the element participates in block layout:

```css
/* Fix: ensure the element is a block-level element */
.observed {
  display: block; /* or inline-block, flex, grid */
}
```

Use `visibility: hidden` or `opacity: 0` instead of `display: none` if you need to hide an element while still measuring it.

## Infinite Render Loop

### Resizing inside the render

If you change an element's size in response to a resize observation, you can create a feedback loop:

```tsx
// DANGER: infinite loop
const { ref, width } = useResizeObserver<HTMLDivElement>();
return (
  <div ref={ref} style={{ width: width !== undefined ? width + 10 : 'auto' }}>
    Content
  </div>
);
```

::: danger
Never set the observed element's dimensions directly from the observed values. This creates a feedback loop where each resize triggers another resize. Instead, set dimensions on a child or sibling element:

```tsx
const { ref, width } = useResizeObserver<HTMLDivElement>();
return (
  <div ref={ref}>
    <div style={{ width: width !== undefined ? width * 0.8 : 'auto' }}>
      Content
    </div>
  </div>
);
```
:::

## SSR: `ReferenceError: ResizeObserver is not defined`

### Importing in server code

The hook must only be used in client components. Ensure your component has `'use client'` at the top:

```tsx
'use client'; // Required for Next.js App Router

import { useResizeObserver } from '@crimson_dev/use-resize-observer';
```

If you need a server-safe import, use the `/server` entry:

```tsx
import { createServerResizeObserverMock } from '@crimson_dev/use-resize-observer/server';
```

## Worker Mode: `SharedArrayBuffer is not defined`

### Missing COOP/COEP headers

Worker mode requires cross-origin isolation. Ensure your server sends:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Verify in the browser console:

```javascript
console.log('crossOriginIsolated:', crossOriginIsolated);
// Must be true for worker mode
```

See the [Worker Mode](/guide/worker) guide for server configuration examples.

### Non-secure context

`SharedArrayBuffer` requires a secure context (HTTPS or `localhost`). It will not work over plain HTTP on non-localhost origins.

## Worker Mode: Third-Party Resources Blocked

### COEP blocking external resources

`Cross-Origin-Embedder-Policy: require-corp` blocks cross-origin resources that don't include `Cross-Origin-Resource-Policy: cross-origin`. This affects external images, third-party scripts, and iframes without CORP headers.

**Solutions:**

1. Add `crossorigin` attribute to external resources:
   ```html
   <img src="https://cdn.example.com/image.jpg" crossorigin="anonymous" />
   ```

2. Use `credentialless` instead of `require-corp` (Chrome 96+):
   ```text
   Cross-Origin-Embedder-Policy: credentialless
   ```

3. Only enable COOP/COEP on pages that need worker mode, not site-wide.

## TypeScript Errors

### `exactOptionalPropertyTypes` and width/height checks

With `exactOptionalPropertyTypes: true`, you cannot use falsy checks for `width` and `height`:

```tsx
// ERROR with exactOptionalPropertyTypes: width could be 0
if (width) { /* ... */ }

// CORRECT
if (width !== undefined) { /* ... */ }
```

### Generic type mismatch

The generic parameter must extend `Element`:

```tsx
// ERROR
const { ref } = useResizeObserver<string>();

// CORRECT
const { ref } = useResizeObserver<HTMLDivElement>();
const { ref } = useResizeObserver<SVGSVGElement>();
```

### Import errors with TypeScript 6 and `isolatedDeclarations`

Ensure your `tsconfig.json` has `moduleResolution` set to `bundler` or `nodenext`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

If you see errors about `isolatedDeclarations`, ensure you are on TypeScript 6.0 or later:

```bash
npm install typescript@latest
```

## `devicePixelContentBoxSize` Returns Same Values as `contentBoxSize`

**Cause:** The browser does not support `devicePixelContentBoxSize` (Safari/WebKit).

The hook gracefully falls back to `contentBoxSize` values (CSS pixels, not device pixels). This is by design -- check [browser support](https://caniuse.com/mdn-api_resizeobserverentry_devicepixelcontentboxsize) before relying on device-pixel precision.

## React Compiler Issues

### Stale closure in onResize

If your `onResize` callback captures stale state, the issue is likely in your component code, not in the hook. The hook stabilizes callback identity via a ref pattern, so the latest closure is always invoked.

### Do not wrap onResize in useCallback

The hook already stabilizes the callback identity internally. Adding `useCallback` creates unnecessary memoization overhead:

```tsx
// UNNECESSARY: double-stabilization
const onResize = useCallback((entry) => { /* ... */ }, []);
useResizeObserver({ onResize });

// CORRECT: just pass the function
useResizeObserver({ onResize: (entry) => { /* ... */ } });
```

## Performance Issues

### Too many re-renders

If you see excessive re-renders, check whether you are using the reactive return values (`width`, `height`) when you only need the callback:

```tsx
// CAUSES RE-RENDERS: width/height change triggers component re-render
const { ref, width, height } = useResizeObserver<HTMLDivElement>();
useEffect(() => {
  drawCanvas(width, height);
}, [width, height]);

// BETTER: use the callback to avoid re-renders entirely
const { ref } = useResizeObserver<HTMLDivElement>({
  onResize: (entry) => {
    drawCanvas(entry.contentRect.width, entry.contentRect.height);
  },
});
```

### Measurements lag behind visual state

This is expected behavior. The hook batches updates via `requestAnimationFrame` and `startTransition`, meaning measurements are 1-2 frames behind the visual state. For most UI applications this is imperceptible. If you need synchronous measurements, use the `onResize` callback which fires directly from the observer.

## `Float16Array is not defined`

**Cause:** Running on a JavaScript engine that does not support ES2026 `Float16Array`.

Worker mode requires `Float16Array`. Ensure your runtime supports it:
- Node.js >= 25.0.0 (development/testing)
- Chromium >= 128, Firefox >= 129 (browser runtime)

If `Float16Array` is not available, worker mode automatically falls back to `Float32Array`.

## Bundle Size Larger Than Expected

**Cause:** Importing from the wrong entry point or importing worker/server code alongside the main hook.

```typescript
// CORRECT: tree-shakeable import (1.12 kB gzip)
import { useResizeObserver } from '@crimson_dev/use-resize-observer';
```

Verify with:
```bash
npm run size
```

## Memory Leak Warnings

Unlikely with this library -- the pool uses `WeakMap` keyed by DOM elements and `FinalizationRegistry` as a safety net. If you see memory leak warnings, they are likely from another library. Verify by checking whether the leaked reference points to a `ResizeObserver` instance.

## Still Stuck?

1. Check the [GitHub Issues](https://github.com/ABCrimson/use-resize-observer/issues)
2. Search for your error message in existing issues
3. Open a new issue with a minimal reproduction
4. Read the [Architecture guide](/guide/architecture) for deeper understanding of internals
