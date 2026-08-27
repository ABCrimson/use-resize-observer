# Migration from use-resize-observer

This guide walks you through migrating from the upstream `use-resize-observer` (v10; v9 notes included where behavior differs) to `@crimson_dev/use-resize-observer`. The API surface is intentionally similar, but there are key differences to be aware of.

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

The import path changes:

```diff
- import { useResizeObserver } from 'use-resize-observer';
+ import { useResizeObserver } from '@crimson_dev/use-resize-observer';
```

Upstream v10 already uses a **named export**, so only the package name changes. If you are coming from v9 (default export), also switch to the named import:

```diff
- import useResizeObserver from 'use-resize-observer';
+ import { useResizeObserver } from '@crimson_dev/use-resize-observer';
```

## Step 3: API Differences

### Return value shape

The return shape is the same: `{ ref, width, height }`. No changes needed for basic usage.

```tsx
// This works identically in both libraries
const { ref, width, height } = useResizeObserver<HTMLDivElement>();
```

### Callback API

Upstream v10's `onResize` callback receives `{ width, height, entry }` (v9 passed only `{ width, height }`). This library passes the raw `ResizeObserverEntry` directly:

```diff
- const { ref } = useResizeObserver({
-   onResize: ({ width, height, entry }) => {
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
The `onResize` callback receives the raw `ResizeObserverEntry` as its only argument. This gives you access to all box models (`borderBoxSize`, `contentBoxSize`, `devicePixelContentBoxSize`) directly in the callback.
:::

### Box model option

Both libraries support the `box` option with all three box models — no change needed here:

```tsx
const { ref, width, height } = useResizeObserver<HTMLDivElement>({
  box: 'border-box', // or 'content-box' (default) or 'device-pixel-content-box'
});
```

This library additionally accepts a `root` option (`Document | ShadowRoot`) to scope the shared pool, which the upstream does not have.

### Ref forwarding

Both libraries support passing an external ref. The option name is the same:

```tsx
const myRef = useRef<HTMLDivElement>(null);
const { width, height } = useResizeObserver({ ref: myRef });
```

### Rounding behavior

The upstream library returns rounded values (`Math.round` by default, customizable via its `round` option). This library returns raw floating-point values from the observer and has no `round` option. If you depend on rounded integers, add rounding at the call site:

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

- **[Worker mode](/guide/worker)** -- share live measurements with compute workers via `SharedArrayBuffer`
- **[Multi-element hook](/guide/advanced)** -- observe N elements with one `useResizeObserverEntries` call
- **[Signals integration](/guide/signals)** -- connect to Preact signals or Reactively
- **[Factory & core APIs](/guide/advanced)** -- framework-agnostic `createResizeObserver` / `createResizeObservable`

## Quick Reference

| Feature | use-resize-observer@10 | @crimson_dev/use-resize-observer |
|---------|------------------------|----------------------------------|
| Import style | Named export | Named export |
| Callback arg | `{ width, height, entry }` | `ResizeObserverEntry` |
| Return values | Rounded (customizable `round`) | Raw floats |
| Box model | All three box models | All three box models |
| `root` option | — | `Document \| ShadowRoot` |
| Observer model | 1 per hook | Shared pool + rAF batching |
| Module format | CJS + ESM dual | ESM only |
| React version | 18.2+ | 19.3+ |
| Worker mode | — | SharedArrayBuffer + Float16Array |
