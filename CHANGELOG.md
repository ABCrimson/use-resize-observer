# Changelog

All notable changes to `@crimson_dev/use-resize-observer` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-03-06

### Fixed
- API reference page returning 404 on GitHub Pages (`docs/api/` was gitignored)
- Pre-commit hook failing on non-processable file types (yml, md, gitignore)

### Changed
- GitHub Actions updated to latest versions: checkout v6, setup-node v6, upload-pages-artifact v4, github-script v8
- VitePress theme enhanced with frosted-glass navigation, feature card hover effects, gradient hero text, animated entrance, custom scrollbar, and oklch color system

## [0.1.0] - 2026-03-05

### Added
- `useResizeObserver` — primary React hook with shared observer pool
- `useResizeObserverEntries` — multi-element observation hook
- `createResizeObserver` — framework-agnostic imperative factory
- `createResizeObservable` — EventTarget-based observable (`/core`)
- `createServerResizeObserverMock` — SSR/RSC safe mock (`/server`)
- `useResizeObserverWorker` — SharedArrayBuffer worker mode (`/worker`)
- ResizeObserver polyfill shim (`/shim`)
- `ResizeObserverContext` for dependency injection
- `ObserverPool` — single shared ResizeObserver per document root
- `RafScheduler` — requestAnimationFrame batching with `startTransition`
- `FinalizationRegistry` for automatic GC cleanup of detached elements
- ES2026 `using` / `Symbol.dispose` support on pool, scheduler, and factory
- All 3 box models: `content-box`, `border-box`, `device-pixel-content-box`
- TypeScript 6 strict configuration with `isolatedDeclarations`
- ESM-only build via tsdown (Rolldown)
- Biome 2.4.5 linting and formatting
- Vitest 4 test infrastructure (72 unit tests)
- Size-limit bundle size guards
- VitePress 2 documentation site
- GitHub Actions CI/CD pipeline
- Changeset-based release pipeline
- Performance benchmarks with tinybench

### Architecture
- Shared observer pool eliminates per-component ResizeObserver overhead
- rAF + startTransition batching: 100 elements → 1 render cycle
- WeakMap-based pool registry scoped per document/shadow root
- Stable callback identity via ref pattern (React Compiler safe)
- Worker mode: SharedArrayBuffer + Float16Array + Atomics for off-main-thread

[0.1.1]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.1.1
[0.1.0]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.1.0
