# Why This Library

## The Problem

Every React application that needs responsive behavior eventually reaches for a ResizeObserver hook. The existing solutions work, but they were designed for an earlier era of React and carry assumptions that no longer hold in React 19.

### What's wrong with existing hooks?

Most ResizeObserver hooks in the ecosystem share these shortcomings:

1. **One observer per element.** Each hook instance creates its own `ResizeObserver`. With 100 observed elements on a page, you get 100 observers, 100 callback closures, and 100 independent render triggers.

2. **No batching strategy.** Callbacks fire synchronously during the browser's layout step. Without coordination, each resize triggers its own `setState`, leading to cascading renders.

3. **CJS + ESM dual publishing.** Most libraries ship both CommonJS and ESM, doubling the maintenance surface and creating subtle interop issues with bundlers.

4. **No worker story.** All measurement happens on the main thread. For complex layouts, this means resize callbacks compete with user interactions for main-thread time.

5. **Pre-React 19 patterns.** Libraries written before React 19 cannot take advantage of `startTransition`, `useEffectEvent`, or the React Compiler's automatic memoization.

## The Solution

`@crimson_dev/use-resize-observer` was built from scratch for the React 19 era:

| Concern | Upstream (v9) | This Library |
|---------|---------------|--------------|
| Observer instances | 1 per hook | 1 shared pool |
| Render batching | None | rAF + startTransition |
| Bundle size | ~1.2KB gzip | 1.11 kB gzip |
| Module format | CJS + ESM | ESM only |
| Worker support | None | SharedArrayBuffer + Float16Array |
| React version | 16.8+ | 19.3+ |
| TypeScript | 4.x | 6.0 strict |
| React Compiler | Untested | Verified safe |

## Design Principles

### ESNext-First

We target ES2026 and let your bundler handle downleveling. This means we can use `using` declarations for automatic cleanup, `Float16Array` for compact worker buffers, `Atomics` for cross-thread dirty-flag protocols, `FinalizationRegistry` for GC-backed cleanup, and `Promise.withResolvers()` for worker initialization.

### Zero Dependencies

The hook has exactly zero runtime dependencies. React itself is the only peer dependency. This keeps the supply chain minimal and the bundle predictable.

### Strict TypeScript

The library compiles under the strictest possible TypeScript 6 configuration:

- `isolatedDeclarations` -- every export has an explicit type
- `erasableSyntaxOnly` -- no enums, no namespaces, no parameter properties
- `exactOptionalPropertyTypes` -- `undefined` is not the same as missing

### Compiler-Safe by Default

Every callback passed to the hook is wrapped with `useEffectEvent` semantics. The React Compiler can freely memoize components that use `useResizeObserver` without any manual `useMemo` or `useCallback` annotations.

::: tip When to choose this library
If you are on React 19.3+ and care about bundle size, render performance, or SAB-based measurement sharing with compute workers, this library is designed for you. If you need React 16/17/18 support, the upstream `use-resize-observer` remains the better choice.
:::

## Further Reading

- [Architecture](/guide/architecture) -- How the shared observer pool works internally
- [Performance](/guide/performance) -- Benchmark comparisons with other hooks
- [Migration](/guide/migration) -- Step-by-step migration from upstream v9
