<div align="center">

<br />

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ABCrimson/use-resize-observer/main/.github/assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/ABCrimson/use-resize-observer/main/.github/assets/logo-light.svg">
  <img alt="@crimson_dev/use-resize-observer" src="https://raw.githubusercontent.com/ABCrimson/use-resize-observer/main/.github/assets/logo-light.svg" width="480">
</picture>

<br />

**Zero-dependency, Worker-native, ESNext-first React 19 ResizeObserver hook**

<br />

<a href="https://npmjs.com/package/@crimson_dev/use-resize-observer"><img src="https://img.shields.io/npm/v/@crimson_dev/use-resize-observer?style=flat-square&color=DC143C&labelColor=0D1117" alt="npm version"></a>
<a href="https://bundlephobia.com/package/@crimson_dev/use-resize-observer"><img src="https://img.shields.io/bundlephobia/minzip/@crimson_dev/use-resize-observer?style=flat-square&color=DC143C&labelColor=0D1117&label=gzip" alt="bundle size"></a>
<a href="https://github.com/ABCrimson/use-resize-observer/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/ABCrimson/use-resize-observer/ci.yml?style=flat-square&labelColor=0D1117&label=CI" alt="CI"></a>
<a href="https://github.com/ABCrimson/use-resize-observer/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@crimson_dev/use-resize-observer?style=flat-square&color=DC143C&labelColor=0D1117" alt="license"></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&labelColor=0D1117" alt="TypeScript"></a>
<a href="https://abcrimson.github.io/use-resize-observer/"><img src="https://img.shields.io/badge/docs-GitHub%20Pages-DC143C?style=flat-square&labelColor=0D1117" alt="docs"></a>

</div>

---

## Quick Start

```bash
npm install @crimson_dev/use-resize-observer
```

```tsx
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

function ResponsiveCard() {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  return (
    <div ref={ref}>
      {width} × {height}
    </div>
  );
}
```

## Why This Exists

Most resize hooks create **one `ResizeObserver` per component**. At scale, that means hundreds of observers competing for the main thread. This library uses a **shared observer pool** — one `ResizeObserver` per document root — with `requestAnimationFrame` batching and React `startTransition` wrapping. The result: **100 elements resizing = 1 render cycle**.

## Highlights

<table>
<tr><td>📦</td><td><strong>1.11 kB</strong> gzip &middot; zero dependencies</td></tr>
<tr><td>⚡</td><td>Shared <code>ResizeObserver</code> pool &middot; rAF batching &middot; <code>startTransition</code></td></tr>
<tr><td>🧵</td><td>Worker mode via <code>SharedArrayBuffer</code> + <code>Float16Array</code></td></tr>
<tr><td>🎯</td><td>All 3 box models: <code>content-box</code>, <code>border-box</code>, <code>device-pixel-content-box</code></td></tr>
<tr><td>🧹</td><td><code>FinalizationRegistry</code> for automatic GC cleanup</td></tr>
<tr><td>🏗️</td><td>ES2026: <code>using</code> / <code>Symbol.dispose</code>, <code>Atomics</code>, <code>Float16Array</code></td></tr>
<tr><td>⚛️</td><td>React 19.3+ &middot; React Compiler verified</td></tr>
<tr><td>📝</td><td>TypeScript 6 strict &middot; <code>isolatedDeclarations</code></td></tr>
<tr><td>🌐</td><td>SSR/RSC safe &middot; server entry with mock result</td></tr>
</table>

## Entry Points

```typescript
// Main — primary hook
import { useResizeObserver } from '@crimson_dev/use-resize-observer';

// Multi-element — observe N elements with 1 hook
import { useResizeObserverEntries } from '@crimson_dev/use-resize-observer';

// Factory — framework-agnostic, imperative API
import { createResizeObserver } from '@crimson_dev/use-resize-observer';

// Worker — SAB-based measurements for cross-thread sharing
import { useResizeObserverWorker } from '@crimson_dev/use-resize-observer/worker';

// Core — EventTarget-based, any framework
import { createResizeObservable } from '@crimson_dev/use-resize-observer/core';

// Server — SSR/RSC safe
import { createServerResizeObserverMock } from '@crimson_dev/use-resize-observer/server';

// Shim — polyfill for legacy browsers
import '@crimson_dev/use-resize-observer/shim';
```

## API

### `useResizeObserver<T>(options?)`

```typescript
const { ref, width, height, entry } = useResizeObserver<HTMLDivElement>({
  box: 'content-box',        // 'content-box' | 'border-box' | 'device-pixel-content-box'
  ref: externalRef,           // optional external ref
  root: shadowRoot,           // optional Document | ShadowRoot
  onResize: (entry) => {},    // stable callback (no useCallback needed)
});
```

| Return | Type | Description |
|--------|------|-------------|
| `ref` | `RefObject<T \| null>` | Attach to the element to observe |
| `width` | `number \| undefined` | Inline size of the observed box |
| `height` | `number \| undefined` | Block size of the observed box |
| `entry` | `ResizeObserverEntry \| undefined` | Raw entry from the observer |

### `useResizeObserverEntries(refs, options?)`

```typescript
const entries = useResizeObserverEntries([ref1, ref2, ref3], {
  box: 'border-box',
});
// entries: Map<Element, { width, height, entry }>
```

### `createResizeObserver(options?)`

```typescript
using observer = createResizeObserver({ box: 'border-box' });
observer.observe(element, (entry) => console.log(entry));
// Automatically cleaned up via Symbol.dispose
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Your Components                 │
│  useResizeObserver()  useResizeObserverEntries() │
└──────────────────────┬──────────────────────────┘
                       │
              ┌────────▼────────┐
              │   ObserverPool  │  1 per document root
              │ WeakMap<Element,│  Single-callback fast path
              │ Callback|Set>   │  FinalizationRegistry
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  RafScheduler   │  Double-buffered Maps
              │  XOR swap       │  Zero-alloc flush
              │  last-write-wins│  requestAnimationFrame
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │ startTransition │  Non-urgent batched update
              │   setState()    │  1 render per frame
              └─────────────────┘
```

## Comparison

| | `use-resize-observer@9` | `@crimson_dev/use-resize-observer` |
|---|---|---|
| Bundle | ~800B | **1.11 kB** (pool + scheduler + hook) |
| React | 16.8+ | **19.3+** with Compiler |
| Module | CJS + ESM | **ESM only** |
| TypeScript | 4.x | **6.0 strict** |
| Observer model | 1 per component | **Shared pool** |
| Worker mode | — | **SharedArrayBuffer** |
| Box models | content-box only | **All 3** |
| GC cleanup | Manual | **Automatic** |
| Batching | None | **rAF + startTransition** |

## Requirements

- **Node** ≥ 25.0.0
- **React** ≥ 19.3.0
- **TypeScript** ≥ 6.0 (recommended)
- **Browser** with native `ResizeObserver` (or use the `/shim` entry)

## License

[MIT](./LICENSE) — Crimson Dev
