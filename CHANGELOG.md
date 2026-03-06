# Changelog

All notable changes to `@crimson_dev/use-resize-observer` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-03-05

### Added
- React Compiler compatibility — verified with `babel-plugin-react-compiler@0.0.0-experimental-1371fcb-20260304`
- Compiler integration test suite (`tests/compiler/`) under React Compiler transformation
- Shared `extractDimensions` / `extractBoxSize` module (`src/extract.ts`) — eliminates duplication across hook, hook-multi, and core
- Coverage thresholds raised to 95% lines/functions/statements, 85% branches

### Changed
- Full ES2026 modernization audit across all source files
  - `Error.isError()` used consistently for cross-realm error discrimination in pool and worker
  - `readonly` parameter types on `sumPrecise` and internal WeakMap values
  - Redundant worker ready signal removed (dead code at module load)
- Benchmark modernization: `using` declarations, `structuredClone()`, `Array.from()`, hoisted allocations
- Test suite hardened: stronger assertions, `findObserverFor` pattern, disposal verification
- 94 unit tests (up from 72), 3 compiler tests — 97 total
- Coverage: 97.65% statements, 90.8% branches, 98.07% functions, 97.52% lines

### Fixed
- Architecture docs: pool API method names corrected in Mermaid diagrams
- Box model docs: `device-pixel-content-box` fallback description matched actual `extractBoxSize` behavior
- Performance docs: `FinalizationRegistry` snippet matched actual `WeakRef<Element>` implementation
- Advanced docs: `createResizeObservable` description accuracy (standalone observer, not shared pool)
- Troubleshooting docs: device-pixel fallback description corrected
- Changelog: "Rolldown 2.x" corrected to "Rolldown 1.x"
- Code block language tags added across worker, bundle-size, and troubleshooting docs

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

[0.2.0]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.2.0
[0.1.1]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.1.1
[0.1.0]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.1.0
