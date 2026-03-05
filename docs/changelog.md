---
layout: doc
---

# Changelog

All notable changes to `@crimson_dev/use-resize-observer` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

See the full [CHANGELOG.md](https://github.com/ABCrimson/use-resize-observer/blob/main/CHANGELOG.md) on GitHub for the machine-readable version.

## [Unreleased]

### Added
- `useResizeObserver` core hook with shared observer pool
- `useResizeObserverEntries` for multi-element observation
- `createResizeObserver` framework-agnostic factory API
- `ResizeObserverContext` for dependency injection and testing
- `createResizeObservable` framework-agnostic core (`/core` entry)
- `createWorkerObserver` for off-main-thread measurements (`/worker` entry)
- `createServerResizeObserverMock` for SSR/RSC (`/server` entry)
- `roundToDevicePixel` WASM rounding utility (`/shim` entry)
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
- Size-limit 12.0.0 bundle size enforcement (< 300B core)
- Biome 2.4.5 linting and formatting
- tsdown 0.21.0-beta.5 build system with Rolldown 2.x
- Changeset-based release pipeline with npm provenance
- GitHub Actions CI/CD with full browser matrix (Chrome, Firefox, WebKit)

### Changed
- Named export (`useResizeObserver`) instead of default export
- `onResize` callback receives `ResizeObserverEntry` instead of `{ width, height }`
- Return values are raw floats instead of rounded integers
- ESM-only distribution (no CJS)

### Removed
- CommonJS build output
- React 16/17/18 support (requires React 19.3+)
- Automatic rounding of dimension values

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
