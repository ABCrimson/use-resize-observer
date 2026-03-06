# Bundle Size

One of the primary design goals of `@crimson_dev/use-resize-observer` is an aggressively small bundle. The full main entry — pool, scheduler, and hook — weighs just 1.11 kB min+gzip.

## Size Budget

| Entry Point | Min+Gzip | Description |
|------------|----------|-------------|
| Main (`useResizeObserver`) | **1.11 kB** | Full hook with pool + scheduler |
| Core (`/core`) | **330 B** | EventTarget-based, framework-agnostic |
| Server (`/server`) | **114 B** | SSR/RSC no-op entry |
| Shim (`/shim`) | **530 B** | Legacy browser polyfill |
| Worker (`/worker`) | **1.17 kB** | SAB-based measurement sharing |

::: tip Measured with size-limit
All size figures are measured using `size-limit` with the project's `.size-limit.json` config. The CI pipeline enforces these budgets on every commit -- a PR that exceeds the budget will fail.
:::

## Why So Small?

### Zero dependencies

The library has no runtime dependencies. The only peer dependency is `react` itself. There is no polyfill, no utility library, no abstraction layer.

### ESM-only

By shipping only ESM, we avoid the overhead of CJS compatibility wrappers, `__esModule` markers, and dual-package interop code. Your bundler receives clean ES modules that tree-shake perfectly.

### Single observer pattern

The shared observer pool is a handful of lines: one `ResizeObserver`, one `WeakMap<Element, Callback | Set<Callback>>` with single-callback fast path, and a double-buffered `RafScheduler`. There is no class hierarchy, no plugin system, no event emitter.

### ES2026 target

By targeting ES2026, we avoid shipping polyfills or transpilation output for features like `using` declarations, optional chaining, or nullish coalescing. The raw source is nearly identical to the compiled output.

## Tree-Shaking

The library is structured as multiple entry points to enable granular tree-shaking:

```text
@crimson_dev/use-resize-observer       -- core hook only
@crimson_dev/use-resize-observer/worker -- worker mode
@crimson_dev/use-resize-observer/server -- SSR/RSC entry
```

If you only import the core hook, the worker and server code is never included in your bundle:

```tsx
// Only the main hook is bundled (1.11 kB)
import { useResizeObserver } from '@crimson_dev/use-resize-observer';
```

```tsx
// Main + worker addon is bundled (~2.36 kB)
import { useResizeObserver } from '@crimson_dev/use-resize-observer';
import { useResizeObserverWorker } from '@crimson_dev/use-resize-observer/worker';
```

### Verifying tree-shaking

You can verify what gets included using your bundler's analysis tools:

```bash
# With esbuild
npx esbuild src/index.tsx --bundle --minify --metafile=meta.json --outfile=out.js
npx esbuild --analyze=verbose meta.json

# With webpack
npx webpack --stats-modules-by-issuer

# With vite
npx vite build --report
```

## Size Comparison

How does this compare to alternatives?

| Library | Min+Gzip | Dependencies | ESM |
|---------|----------|-------------|-----|
| **@crimson_dev/use-resize-observer** | **1.11 kB** | **0** | **Yes** |
| use-resize-observer@9.1.0 | ~1.2KB | 0 | Dual |
| react-resize-detector | ~3.4KB | 2 | Dual |
| @react-hook/resize-observer | ~1.8KB | 2 | Dual |
| react-use (useResizeObserver) | ~15KB+ | 20+ | No |

## Enforcing the Budget

The CI pipeline runs a size check on every PR:

```yaml
# .github/workflows/ci.yml (simplified)
- name: Check bundle size
  run: npx size-limit
```

::: danger Breaking the budget
If a PR increases any entry point beyond its configured limit, the CI size check will fail. To add new features without breaking the budget, consider adding them as a separate entry point (like `/worker` or `/server`).
:::

## Import Cost

If you use the [Import Cost](https://marketplace.visualstudio.com/items?itemName=wix.vscode-import-cost) VS Code extension, you will see the size inline next to your import statement. The main hook should display as approximately 1.11 kB gzip.

## Next Steps

- [Performance](/guide/performance) -- Runtime performance, not just bundle size
- [Architecture](/guide/architecture) -- Why the pool pattern keeps code minimal
- [Worker Mode](/guide/worker) -- The additional 1.17 kB for SAB-based measurement sharing
