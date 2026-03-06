---
layout: doc
---

# Changelog

All notable changes to `@crimson_dev/use-resize-observer` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

See the full [CHANGELOG.md](https://github.com/ABCrimson/use-resize-observer/blob/main/CHANGELOG.md) on GitHub for the machine-readable version.

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
- `createWorkerObserver` for off-main-thread measurements (`/worker` entry)
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
