# Changelog

All notable changes to `@crimson_dev/use-resize-observer` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-03-06

### Added
- CI matrix expanded to 3 OS: ubuntu-latest, windows-latest, macos-latest
- Socket Security scanning on pull requests (`socket-security/socket-security-action@v1`)
- `npm audit --omit=dev` security gate in CI and release workflows
- Lighthouse CI auditing on docs deployment (performance budgets enforced)
- VitePress sitemap generation for SEO
- `robots.txt` for search engine crawling
- `npm pack --dry-run` and `npx publint` verification in release workflow
- Complete release checklist in CONTRIBUTING.md
- `homepage`, `bugs`, and `funding` fields in package.json

### Changed
- ES2026/TS6 modernization across all 10 source files:
  - Nullish coalescing (`??`) replaces verbose ternary null checks
  - Optional chaining (`?.`) replaces explicit undefined guards
  - Template literals replace string concatenation
  - Typed tuple eliminates non-null assertions in scheduler
  - Set iterator `.next()` eliminates non-null assertion in pool demotion
- Bundle sizes decreased: main 1.11 kB, worker 1.17 kB, core 330 B, shim 530 B
- TypeScript 7 native preview (`tsgo`) verification in CI quality job

## [0.5.0] - 2026-03-06

### Breaking Changes
- Worker mode redesigned: `useResizeObserverWorker` now runs `ResizeObserver` on the main thread and writes measurements to a `SharedArrayBuffer` for zero-copy sharing with compute workers (WebGL, WASM). The previous architecture (observation inside a Web Worker) was architecturally broken — `ResizeObserver` is a DOM API unavailable in Workers. The deleted `worker.ts` file is no longer needed.

### Fixed
- **Critical**: SAB memory layout collision — `Int32Array` dirty flags and `Float16Array` data overlapped at byte 0. Dirty flag region now occupies bytes 0–1023, data region starts at byte 1024.
- **Critical**: Worker mode used `ResizeObserver` inside a Web Worker where the DOM API is unavailable. Redesigned to main-thread observation with SAB data sharing.
- **High**: `FinalizationRegistry` cleanup attempted `unobserve()` on GC'd elements (impossible — `WeakRef.deref()` returns `undefined`). Now only decrements the internal counter; the browser already stops observing GC'd targets.
- **High**: `ResizeObserverContext` was exported but never wired into hooks. Both `useResizeObserver` and `useResizeObserverEntries` now consume the context and pass custom constructors to the pool.
- **High**: `ObserverPool.observe()` skipped `ResizeObserver.observe()` for already-tracked elements, preventing box option updates. Now always calls `observe()` with the latest options.
- **Medium**: `useResizeObserverEntries` created a new `Map` on every resize even when dimensions were unchanged. Added identity comparison to skip unnecessary allocations.
- **Medium**: `sideEffects: false` in `package.json` caused bundlers to tree-shake the `/shim` entry. Changed to `sideEffects: ["./dist/shim.js"]`.
- **Medium**: Global `'use client'` banner in tsdown config applied to all entries including `/server` and `/core`. Removed global banner; source-level directives handle this correctly.
- **Low**: `extractBoxSize` returned silent `undefined` for empty size arrays — now returns `{ width: 0, height: 0 }`.
- **Low**: Dead `elementId` field removed from worker protocol types.
- **Low**: Module-level `slotBitmap` in worker hook properly scoped.

### Added
- Integration test suite (9 tests): full pool → scheduler → React state pipeline
- Worker protocol test suite (28 tests): SAB memory layout, dirty flag isolation, write/read round-trip, slot allocation/release lifecycle
- Box option change tests (3 tests): verifies re-observation with updated options
- FinalizationRegistry tests (5 tests): registration, unregistration, multi-callback scenarios
- Multi-element edge case tests (4 tests): duplicate refs, dynamic add/remove, Map identity optimization

### Changed
- Worker protocol: `SAB_SIZE` increased from 2048 to 3072 bytes (separate dirty flag and data regions)
- Worker protocol exports: added `DATA_OFFSET`, `DIRTY_REGION_BYTES` constants
- `ObserverPool` constructor accepts optional `ResizeObserver` constructor for DI
- All architecture documentation updated to reflect main-thread observation model
- All bundle size references updated to 1.12 kB across documentation
- 151 tests across 16 suites (up from 102 tests in 14 suites)

## [0.4.1] - 2026-03-06

### Changed
- Dependency upgrades: Biome 2.4.6, tsdown 0.21.0 (stable), Vitest 4.1.0-beta.6, @vitejs/plugin-react 5.1.4, Playwright 1.59.0-alpha-2026-03-06, publint 0.3.18
- `core.ts`: Replaced `Object.assign(EventTarget)` with proper `ResizeObservableImpl` class extending `EventTarget` — eliminates runtime overhead, cleaner prototype chain
- `hook-multi.ts`: Replaced closure-based cleanup array with tuple tracking `[Element, ResizeCallback]` — avoids intermediate closure allocation per ref
- `worker/hook.ts`: Combined separate `width`/`height` `useState` into single state object — batches into 1 render instead of 2 per frame
- `worker/protocol.ts`: Replaced manual `for` loop in `allocateSlot` with `Int32Array.prototype.indexOf()` — delegates to native code for faster slot scanning
- Biome schema updated to 2.4.6

## [0.4.0] - 2026-03-06

### Added
- Benchmark suite modernization: JSON results output to `bench/results/`, 500-element scheduler tier, writeSlot/readSlot roundtrip latency benchmark, heap delta tracking
- Concurrency stress tests: 1000 elements in same rAF, rapid observe/unobserve cycling, concurrent callbacks, 1000-element scheduler flush
- Memory pressure tests: 10k cycle leak detection, mass observe/unobserve verification, repeated pool disposal, worker slot bitmap full recycling
- CI benchmark workflow (`.github/workflows/bench.yml`): auto-runs on push/PR, uploads artifacts, posts PR comments with results
- Accessibility: ARIA live regions (`aria-live="polite"`, `role="status"`) on visualizer dimension readout, `role="img"` on bar chart
- Accessibility documentation section in visualizer demo page

### Changed
- Worker hook now respects `box` option (previously ignored — always read content-box dimensions)
- Worker hook effect dependency array includes `box` for proper re-subscription on box model change
- Deep modernization audit of all 18 source files and 14 test files — all confirmed ES2026-compliant
- V8 optimization audit: all hot paths (`observe`, `unobserve`, `schedule`, `writeSlot`, `readSlot`) confirmed monomorphic with no deoptimizations
- Performance guide updated with V8 audit results and actual benchmark numbers
- Test suite expanded: 102 tests across 14 suites (up from 94 tests in 12 suites)

### Fixed
- Worker hook `box` option was declared but not used — border-box measurements now correctly read from `borderWidth`/`borderHeight` slot values

## [0.3.0] - 2026-03-05

### Added
- OKLCH theme hardening: `@property` definitions, `:root:not(.dark)` light mode, `--c-nav-bg` token
- Typography: `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs, h5/h6 styles
- Accessibility: universal `prefers-reduced-motion` reset, `:focus-visible` keyboard navigation style
- GPU optimization: compositor-only shimmer animation, explicit `will-change` on animated elements
- Firefox scrollbar styling (`scrollbar-width: thin`)
- `content-visibility: auto` on footer for off-screen optimization
- `view-transition-name: sidebar` for page navigation transitions

### Changed
- All "Sub-300B" size claims corrected to actual 1.04 kB across homepage, README, bundle-size guide, blog, contributing, architecture, and troubleshooting docs
- `src/shim/wasm-round.ts`: `sumPrecise` param now `readonly number[]`; `normalizeDimension` delegates to `roundToDevicePixel` (removes duplication)
- `src/pool.ts`: clarifying comment on fire-and-forget `Promise.try()` pattern
- SVG diagrams optimized via SVGO 4: 24-33% size reduction with `prefers-reduced-motion` preserved
- All `transition: all` replaced with explicit property lists across theme CSS
- Nav/sidebar/search backdrop-filter enhanced with `saturate()` for richer visual effect
- Theme animations: `will-change: background` replaced with `will-change: --crimson-hue` (compositor-friendly)

### Fixed
- Visualizer demo page: replaced incomplete `<script setup>` stub with proper info block
- Homepage tagline: "Sub-300B gzip" corrected to "< 1.1kB gzip"
- 8 documentation pages with stale size claims corrected
- Light mode theme not applying (was using `@media prefers-color-scheme` instead of VitePress `.dark` class toggle)

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

[0.5.0]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.5.0
[0.4.1]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.4.1
[0.4.0]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.4.0
[0.3.0]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.3.0
[0.2.0]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.2.0
[0.1.1]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.1.1
[0.1.0]: https://github.com/ABCrimson/use-resize-observer/releases/tag/v0.1.0
