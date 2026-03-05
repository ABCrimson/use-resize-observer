# Migration from use-resize-observer v9

This guide walks you through migrating from the upstream `use-resize-observer@9.1.0` to `@crimson_dev/use-resize-observer`. The API surface is intentionally similar, but there are key differences to be aware of.

## Step 1: Update Dependencies

```bash
# Remove the old package
npm uninstall use-resize-observer

# Install the new one
npm install @crimson_dev/use-resize-observer
```

::: warning React 19.3+ Required
Before migrating, ensure your project is on React 19.3.0 or later. This library does not support React 16, 17, or 18.
:::

## Step 2: Update Imports

The primary import path changes:

```diff
- import useResizeObserver from 'use-resize-observer';
+ import { useResizeObserver } from '@crimson_dev/use-resize-observer';
```

Note that this library uses a **named export** rather than a default export.

## Step 3: API Differences

### Return value shape

The return shape is the same: `{ ref, width, height }`. No changes needed for basic usage.

```tsx
// This works identically in both libraries
const { ref, width, height } = useResizeObserver<HTMLDivElement>();
```

### Callback API

The upstream library uses an `onResize` callback with `{ width, height }`:

```diff
- const { ref } = useResizeObserver({
-   onResize: ({ width, height }) => {
-     console.log(width, height);
-   },
- });

+ const { ref } = useResizeObserver({
+   onResize: (entry) => {
+     // You get the full ResizeObserverEntry
+     const { width, height } = entry.contentRect;
+     console.log(width, height);
+   },
+ });
```

::: tip Full Entry Access
The new `onResize` callback receives the raw `ResizeObserverEntry` instead of a simplified `{ width, height }` object. This gives you access to all box models (`borderBoxSize`, `contentBoxSize`, `devicePixelContentBoxSize`) directly in the callback.
:::

### Box model option

The upstream library always uses `content-box`. This library lets you choose:

```tsx
const { ref, width, height } = useResizeObserver<HTMLDivElement>({
  box: 'border-box', // or 'content-box' (default) or 'device-pixel-content-box'
});
```

### Ref forwarding

Both libraries support passing an external ref. The option name is the same:

```tsx
const myRef = useRef<HTMLDivElement>(null);
const { width, height } = useResizeObserver({ ref: myRef });
```

### Rounding behavior

The upstream library returns rounded values (`Math.round`). This library returns raw floating-point values from the observer. If you depend on rounded integers, add rounding at the call site:

```tsx
const { ref, width, height } = useResizeObserver<HTMLDivElement>();
const roundedWidth = width !== undefined ? Math.round(width) : undefined;
```

## Step 4: TypeScript Changes

### Generic constraint

The generic parameter constrains to `Element` rather than `HTMLElement`:

```tsx
// Both of these work
const { ref } = useResizeObserver<HTMLDivElement>();
const { ref: svgRef } = useResizeObserver<SVGSVGElement>();
```

### Strict mode

If you enable `exactOptionalPropertyTypes` in your tsconfig (recommended), the `width` and `height` return types are `number | undefined` and you must check for `undefined` explicitly rather than relying on falsy checks:

```tsx
// Correct
if (width !== undefined) { /* ... */ }

// Incorrect with exactOptionalPropertyTypes
if (width) { /* ... */ } // Fails when width is 0
```

## Step 5: Remove Polyfills

If you were using a `ResizeObserver` polyfill for older browsers, you can likely remove it. This library targets modern browsers that ship `ResizeObserver` natively (Chrome 64+, Firefox 69+, Safari 13.1+).

::: danger No IE11 Support
This library is ESM-only and uses modern APIs. It will not work in Internet Explorer.
:::

## Step 6: Optional Enhancements

After migrating, you can take advantage of features not available in the upstream:

- **[Worker mode](/guide/worker)** -- offload measurements to a Web Worker
- **[Box models](/guide/box-models)** -- use `border-box` or `device-pixel-content-box`
- **[Signals integration](/guide/signals)** -- connect to Preact signals or Reactively
- **[Factory API](/guide/advanced)** -- create pre-configured hook instances

## Quick Reference

| Feature | use-resize-observer@9 | @crimson_dev/use-resize-observer |
|---------|----------------------|----------------------------------|
| Import style | Default export | Named export |
| Callback arg | `{ width, height }` | `ResizeObserverEntry` |
| Return values | Rounded integers | Raw floats |
| Box model | content-box only | All three box models |
| Module format | CJS + ESM | ESM only |
| React version | 16.8+ | 19.3+ |
| TypeScript | 4.x+ | 6.0+ strict |
