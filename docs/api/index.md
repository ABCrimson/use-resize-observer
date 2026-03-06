---
layout: doc
---

# API Reference

Complete API documentation for `@crimson_dev/use-resize-observer`.

## Main Entry (`@crimson_dev/use-resize-observer`)

### `useResizeObserver<T>(options?)`

Primary hook for observing element resize events.

**Type Parameters:**
- `T extends Element = Element` — The element type being observed.

**Parameters:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ref` | `RefObject<T \| null>` | — | Pre-existing ref. If omitted, an internal ref is created. |
| `box` | `'content-box' \| 'border-box' \| 'device-pixel-content-box'` | `'content-box'` | Which CSS box model to report. |
| `root` | `Document \| ShadowRoot` | `ownerDocument` | Pool scope for shadow DOM support. |
| `onResize` | `(entry: ResizeObserverEntry) => void` | — | Callback fired on every resize. Identity-stable (no `useCallback` needed). |

**Returns:** `UseResizeObserverResult<T>`

| Property | Type | Description |
|----------|------|-------------|
| `ref` | `RefObject<T \| null>` | Attach to the element to observe. |
| `width` | `number \| undefined` | Inline size. `undefined` until first observation. |
| `height` | `number \| undefined` | Block size. `undefined` until first observation. |
| `entry` | `ResizeObserverEntry \| undefined` | Raw entry. `undefined` until first observation. |

```tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

const { ref, width, height } = useResizeObserver<HTMLDivElement>({
  box: 'border-box',
  onResize: (entry) => console.log(entry),
});
```

---

### `useResizeObserverEntries(refs, options?)`

Multi-element variant: observe multiple elements through a single pool subscription.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `refs` | `ReadonlyArray<RefObject<Element \| null>>` | Array of refs to observe. |
| `options.box` | `ResizeObserverBoxOptions` | Box model. Default: `'content-box'`. |
| `options.root` | `Document \| ShadowRoot` | Pool scope. |

**Returns:** `Map<Element, ResizeEntry>`

Each entry: `{ width: number; height: number; entry: ResizeObserverEntry }`.

---

### `createResizeObserver(options?)`

Framework-agnostic factory using the shared pool.

**Parameters:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `box` | `ResizeObserverBoxOptions` | `'content-box'` | Box model. |
| `root` | `Document \| ShadowRoot` | `document` | Pool scope. |

**Returns:** `ResizeObserverFactory`

| Method | Signature | Description |
|--------|-----------|-------------|
| `observe` | `(target: Element, cb: ResizeCallback) => void` | Start observing. |
| `unobserve` | `(target: Element, cb: ResizeCallback) => void` | Stop one callback. |
| `disconnect` | `() => void` | Stop all observations. |

---

### `ResizeObserverContext`

React Context for injecting a custom `ResizeObserver` constructor (testing, SSR, polyfills).

```tsx
import { ResizeObserverContext } from '@crimson_dev/use-resize-observer';

<ResizeObserverContext.Provider value={MockResizeObserver}>
  <App />
</ResizeObserverContext.Provider>
```

---

## Worker Entry (`@crimson_dev/use-resize-observer/worker`)

### `useResizeObserverWorker<T>(options?)`

Main-thread resize observation with `SharedArrayBuffer` + `Float16Array` + `Atomics` for zero-copy data sharing with compute workers.

Requires `crossOriginIsolated === true` (COOP/COEP headers).

**Parameters:** Same as `useResizeObserver` except `onResize` receives `{ width, height }` instead of `ResizeObserverEntry`.

**Returns:** `UseResizeObserverResult<T>` (entry is always `undefined` in Worker mode).

---

## Server Entry (`@crimson_dev/use-resize-observer/server`)

### `createServerResizeObserverMock<T>()`

Returns a mock `UseResizeObserverResult<T>` with all values `undefined`. Safe for SSR/RSC.

### `isResizeObserverSupported()`

Returns `boolean`. `false` on server, `true` if `globalThis.ResizeObserver` exists.

---

## Core Entry (`@crimson_dev/use-resize-observer/core`)

### `createResizeObservable(target, options?)`

Framework-agnostic observable using `EventTarget` dispatching.

```ts
import { createResizeObservable } from '@crimson_dev/use-resize-observer/core';

const obs = createResizeObservable(element, { box: 'content-box' });
obs.addEventListener('resize', (e) => {
  const { width, height } = (e as CustomEvent).detail;
});
obs.disconnect();
```

### `ResizeEvent`

Custom event class extending `CustomEvent<ResizeEventDetail>`.

---

## Shim Entry (`@crimson_dev/use-resize-observer/shim`)

### `ResizeObserverShim`

Polyfill class installed on `globalThis.ResizeObserver` if native is unavailable. Uses rAF polling.

### `sumPrecise(values: number[])`

Precise floating-point sum using `Math.sumPrecise()` (ES2026) with fallback.

---

## Types

```ts
type ResizeCallback = (entry: ResizeObserverEntry) => void;
type ResizeObserverBoxOptions = 'border-box' | 'content-box' | 'device-pixel-content-box';

interface UseResizeObserverOptions<T extends Element = Element> {
  ref?: RefObject<T | null>;
  box?: ResizeObserverBoxOptions;
  root?: Document | ShadowRoot;
  onResize?: (entry: ResizeObserverEntry) => void;
}

interface UseResizeObserverResult<T extends Element = Element> {
  ref: RefObject<T | null>;
  width: number | undefined;
  height: number | undefined;
  entry: ResizeObserverEntry | undefined;
}
```
