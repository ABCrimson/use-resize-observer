---
layout: doc
---

# Changelog

All notable changes to `@crimson_dev/use-resize-observer` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

See the full [CHANGELOG.md](https://github.com/ABCrimson/use-resize-observer/blob/main/CHANGELOG.md) on GitHub for the machine-readable version.

## [0.8.0] - 2026-03-06

### Added
- CI matrix expanded to 3 OS (ubuntu, windows, macos)
- Socket Security scanning on PRs
- `npm audit --omit=dev` gate in CI and release
- Lighthouse CI on docs deployment
- VitePress sitemap, robots.txt for SEO
- Release workflow hardened with publint + pack verification
- Complete release checklist in CONTRIBUTING.md
- Package metadata: `homepage`, `bugs`, `funding`

### Changed
- ES2026/TS6 modernization: nullish coalescing, optional chaining, template literals, typed tuples
- Bundle sizes decreased: main 1.11 kB, worker 1.17 kB, core 330 B, shim 530 B

## [0.5.0] - 2026-03-06

### Breaking Changes
- Worker mode redesigned: `useResizeObserverWorker` now runs `ResizeObserver` on the main thread and writes measurements to a `SharedArrayBuffer` for zero-copy sharing with compute workers (WebGL, WASM). The previous architecture was broken — `ResizeObserver` is a DOM API unavailable in Web Workers.

### Fixed
- **Critical**: SAB memory layout collision — dirty flags and data overlapped at byte 0. Separated into two regions (0–1023 for Int32 flags, 1024–3071 for Float16 data).
- **Critical**: Worker mode attempted `ResizeObserver` inside a Web Worker. Redesigned to main-thread observation + SAB sharing.
- **High**: `FinalizationRegistry` cleanup attempted `unobserve()` on GC'd elements. Now only decrements counter.
- **High**: `ResizeObserverContext` wired into both hooks for dependency injection.
- **High**: Pool now always re-observes with latest box options.
- **Medium**: `useResizeObserverEntries` Map identity optimization — skips allocation when dimensions unchanged.
- **Medium**: `sideEffects` changed to `["./dist/shim.js"]` to prevent tree-shaking the polyfill.
- **Medium**: Removed global `'use client'` banner from non-client entries.
- **Low**: `extractBoxSize` handles empty size arrays, dead `elementId` removed, `slotBitmap` scoped.

### Added
- Integration tests (9), worker-protocol tests (28), box change tests (3), FinalizationRegistry tests (5), multi-element edge cases (4)
- 151 tests across 16 suites

### Changed
- SAB size: 2048 → 3072 bytes (separate dirty flag / data regions)
- `ObserverPool` constructor accepts optional `ResizeObserver` constructor for DI
- All documentation updated for main-thread observation model and 1.12 kB size

## [0.4.1] - 2026-03-06

### Changed
- Dependency upgrades: Biome 2.4.6, tsdown 0.21.0 (stable), Vitest 4.1.0-beta.6, @vitejs/plugin-react 5.1.4, Playwright 1.59.0-alpha-2026-03-06, publint 0.3.18
- `core.ts`: Proper `EventTarget` subclass replaces `Object.assign` pattern
- `hook-multi.ts`: Tuple-based cleanup tracking replaces closure array
- `worker/hook.ts`: Single-object state batching replaces dual `useState`
- `worker/protocol.ts`: Native `indexOf` replaces manual loop in slot allocation
- Biome schema updated to 2.4.6

## [0.4.0] - 2026-03-06

### Added
- Benchmark suite modernization: JSON results output, 500-element scheduler tier, writeSlot/readSlot roundtrip, heap delta tracking
- Concurrency stress tests (1000 elements, rapid cycling, concurrent callbacks, 1000-element scheduler flush)
- Memory pressure tests (10k cycle leak detection, slot bitmap recycling)
- CI benchmark workflow with PR comment reporting
- ARIA live regions and accessibility docs for visualizer

### Changed
- Worker hook now respects `box` option for border-box/content-box selection
- V8 optimization audit: all hot paths monomorphic, zero deoptimizations
- Performance guide updated with V8 audit results and benchmark data
- Deep modernization audit: all 18 source files and 14 test suites confirmed ES2026-compliant
- 102 tests across 14 suites (up from 94/12)

### Fixed
- Worker hook `box` option was declared but not used — now correctly reads border-box slot values

## [0.3.0] - 2026-03-05

### Added
- OKLCH theme hardening: `@property` definitions, light mode fix, nav background token
- Typography: `text-wrap: balance/pretty`, h5/h6 styles, font fallback improvements
- Accessibility: universal `prefers-reduced-motion` reset, `:focus-visible` styles
- GPU optimization: compositor-only animations, explicit `will-change`, `content-visibility: auto`
- Firefox scrollbar styling, `view-transition-name: sidebar`

### Changed
- All "Sub-300B" size claims corrected to actual 1.04 kB across all docs
- `src/shim/wasm-round.ts`: `readonly` param, removed duplication
- SVG diagrams optimized via SVGO 4 (24-33% reduction)
- Theme CSS: explicit transition properties, enhanced backdrop-filter

### Fixed
- Visualizer demo page stub replaced with proper info block
- Homepage tagline corrected to "< 1.1kB gzip"
- Light mode theme not applying (VitePress class toggle vs media query)
- 8 documentation pages with stale size claims

## [0.2.0] - 2026-03-05

### Added
- React Compiler compatibility verified with `babel-plugin-react-compiler`
- Compiler integration test suite under React Compiler transformation
- Shared `extractDimensions` / `extractBoxSize` module for consistent dimension extraction
- Coverage thresholds raised to 95%+ (97.65% statements, 90.8% branches)

### Changed
- Full ES2026 modernization audit — `Error.isError()`, `readonly` params, `using` in benchmarks
- Test suite hardened with stronger assertions and `findObserverFor` pattern
- 97 total tests (94 unit + 3 compiler)

### Fixed
- Architecture, box model, performance, and troubleshooting docs corrected for accuracy
- Code block language tags and Mermaid diagram accuracy

## [0.1.1] - 2026-03-06

### Fixed
- API reference page returning 404 on GitHub Pages (`docs/api/` was gitignored)
- Pre-commit hook failing on non-processable file types (yml, md, gitignore)

### Changed
- GitHub Actions updated to latest versions: checkout v6, setup-node v6, upload-pages-artifact v4, github-script v8
- VitePress theme enhanced with frosted-glass navigation, feature card hover effects, gradient hero text, animated entrance, custom scrollbar, and oklch color system

## [0.1.0] - 2026-03-05

### Added
- `useResizeObserver` core hook with shared observer pool
- `useResizeObserverEntries` for multi-element observation
- `createResizeObserver` framework-agnostic factory API
- `ResizeObserverContext` for dependency injection and testing
- `createResizeObservable` framework-agnostic core (`/core` entry)
- `useResizeObserverWorker` for SAB-based measurements (`/worker` entry)
- `createServerResizeObserverMock` for SSR/RSC (`/server` entry)
- rAF batching with `startTransition` integration
- Support for all three box models: `content-box`, `border-box`, `device-pixel-content-box`
- `onResize` callback with full `ResizeObserverEntry` access
- External ref forwarding support
- Shadow DOM support via `root` option
- ES2026 `using` declaration support for automatic cleanup
- `FinalizationRegistry`-backed GC safety net
- React Compiler compatibility (verified)
- TypeScript 6 strict mode (`isolatedDeclarations`, `erasableSyntaxOnly`, `exactOptionalPropertyTypes`)
- VitePress 2.0.0-alpha.16 documentation site with OKLCH theme
- Comprehensive test suite (Vitest 4.1.0-beta.5, unit + browser)
- Size-limit 12.0.0 bundle size enforcement (1.04 kB main entry)
- Biome 2.4.5 linting and formatting
- tsdown 0.21.0-beta.5 build system with Rolldown 1.x
- Changeset-based release pipeline with npm provenance
- GitHub Actions CI/CD with full browser matrix (Chrome, Firefox, WebKit)

## [0.0.1] - 2026-03-05

### Added
- Repository initialization
- `@crimson_dev` npm scope registration
- Package identity and metadata
- MIT License
- Node 25 development environment
- Initial project scaffold with full TypeScript 6 configuration

---

::: tip Changeset Workflow
This project uses [changesets](https://github.com/changesets/changesets) for version management. Each PR that changes public API includes a changeset file describing the change. The changelog is automatically generated from these changesets during release.
:::
