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

**Returns:** `ResizeObserverFactory & Disposable`

| Method | Signature | Description |
|--------|-----------|-------------|
| `observe` | `(target: Element, cb: ResizeCallback) => void` | Start observing. |
| `unobserve` | `(target: Element, cb: ResizeCallback) => void` | Stop one callback. |
| `disconnect` | `() => void` | Stop all observations tracked by this factory. |
| `[Symbol.dispose]` | `() => void` | Calls `disconnect()`; enables `using` declarations. |

Runs on the shared pool — the same native `ResizeObserver` and rAF scheduler as the React hooks.

---

### `ResizeObserverContext`

React Context for injecting a custom `ResizeObserver` constructor (testing, SSR, polyfills).

```tsx
import { ResizeObserverContext } from '@crimson_dev/use-resize-observer';

<ResizeObserverContext value={MockResizeObserver}>
  <App />
</ResizeObserverContext>
```

---

## Worker Entry (`@crimson_dev/use-resize-observer/worker`)

### `useResizeObserverWorker<T>(options?)`

Main-thread resize observation with `SharedArrayBuffer` + `Float16Array` + `Atomics` for zero-copy data sharing with compute workers.

Requires `crossOriginIsolated === true` (COOP/COEP headers).

**Parameters:** `ref` and `box` as in `useResizeObserver` — there is no `root` option (the SAB pool is document-global), and `onResize` receives `{ width, height }` instead of a `ResizeObserverEntry`. The SAB slot stores `content-box` and `border-box` sizes; `device-pixel-content-box` reports content-box values in Worker mode.

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

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `target` | `Element` | — | Element to observe. |
| `options.box` | `ResizeObserverBoxOptions` | `'content-box'` | Box model to report. |

**Returns:** `ResizeObservable` — `EventTarget & Disposable`, plus `disconnect(): void`.

```ts
import {
  createResizeObservable,
  type ResizeEventDetail,
} from '@crimson_dev/use-resize-observer/core';

const obs = createResizeObservable(element, { box: 'content-box' });
obs.addEventListener('resize', (e) => {
  const { width, height } = (e as CustomEvent<ResizeEventDetail>).detail;
});
obs.disconnect();
```

> [!IMPORTANT]
> This entry is **not pooled**. Each call constructs its own native `ResizeObserver`. Use `createResizeObserver` from the main entry when you want pooled observation.

### `ResizeEvent`

Custom event class extending `CustomEvent<ResizeEventDetail>`, dispatched with type `'resize'`.

### `ResizeEventDetail`

```ts
interface ResizeEventDetail {
  readonly width: number;
  readonly height: number;
  readonly entry: ResizeObserverEntry;
}
```

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

interface CreateResizeObserverOptions {
  box?: ResizeObserverBoxOptions;
  root?: Document | ShadowRoot;
}

interface ResizeObserverFactory {
  observe(target: Element, callback: ResizeCallback): void;
  unobserve(target: Element, callback: ResizeCallback): void;
  disconnect(): void;
}

// Value type in the Map returned by useResizeObserverEntries
interface ResizeEntry {
  readonly width: number;
  readonly height: number;
  readonly entry: ResizeObserverEntry;
}

interface UseResizeObserverEntriesOptions {
  box?: ResizeObserverBoxOptions;
  root?: Document | ShadowRoot;
}
```

All of the above are exported as types from the main entry, except `ResizeEventDetail`, `ResizeObservable`, and `CreateResizeObservableOptions`, which come from `/core`.

---

> [!NOTE]
> **Maintainers:** this page is hand-written and must be updated by hand when the public API changes — it is not generated on deploy. `typedoc.json` points its `out` at `docs/api`, so running `npm run docs:build` locally overwrites this file. See [CONTRIBUTING](https://github.com/ABCrimson/use-resize-observer/blob/main/CONTRIBUTING.md#documentation).
