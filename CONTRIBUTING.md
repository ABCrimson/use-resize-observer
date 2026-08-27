# Contributing to @crimson_dev/use-resize-observer

Thank you for your interest in contributing!

## Development Setup

### Prerequisites

Three different Node versions appear in this repo, each with its own authority. They are not in conflict — they answer different questions.

| Question | Answer | Source of truth |
|----------|--------|-----------------|
| What Node do I develop on? | **26** | `.nvmrc` — `nvm use` picks it up |
| What Node does CI run? | **25** | `node-version: '25'` in every `actions/setup-node` step across `.github/workflows/` |
| What Node may a consumer install on? | **>= 25** | `engines.node` in `package.json` |

npm ships with Node; no separate install is needed. `package-lock.json` is `lockfileVersion: 3`, so any npm that ships with a supported Node can run `npm ci`.

> [!NOTE]
> Develop on 26 (`.nvmrc`) but remember CI validates on 25. If you reach for a Node 26-only API, CI is where you will find out.

### Getting Started

```bash
# Clone the repository
git clone https://github.com/ABCrimson/use-resize-observer.git
cd use-resize-observer

# Install dependencies
npm ci

# Build the library
npm run build

# Run tests
npm run test

# Start docs dev server
npm run docs:dev
```

### Source Map

Every published entry point in `package.json#exports` maps to one file in `src/`. Start here before changing anything.

| Path | Entry | What lives there |
|------|-------|------------------|
| `src/index.ts` | `.` | Public barrel — re-exports the hook, multi-hook, factory, and context |
| `src/hook.ts` | `.` | `useResizeObserver` — the primary hook |
| `src/hook-multi.ts` | `.` | `useResizeObserverEntries` — many elements, one `Map` result |
| `src/factory.ts` | `.` | `createResizeObserver` — non-React factory **over the shared pool** |
| `src/context.ts` | `.` | `ResizeObserverContext` — constructor injection for tests/SSR/polyfills |
| `src/pool.ts` | internal | `ObserverPool` — one native `ResizeObserver` per document/shadow root |
| `src/scheduler.ts` | internal | rAF batching + `startTransition`; 100 resizes → 1 React render |
| `src/extract.ts` | internal | Box-model → `{ width, height }` extraction (hot path) |
| `src/types.ts` | internal | Shared public types |
| `src/core.ts` | `./core` | `createResizeObservable` — `EventTarget`-based, framework-agnostic |
| `src/server.ts` | `./server` | SSR/RSC mock result and support probe |
| `src/shim.ts` | `./shim` | `ResizeObserverShim` polyfill (rAF polling); the only `sideEffects` entry |
| `src/shim/wasm-round.ts` | internal | Device-pixel rounding helpers, optional WASM-backed |
| `src/worker/index.ts` | `./worker` | Worker barrel — the bundler entry for the `./worker` subpath |
| `src/worker/hook.ts` | `./worker` | `useResizeObserverWorker` — `SharedArrayBuffer` measurements |
| `src/worker/protocol.ts` | `./worker` | SAB layout: 3072 B = 1024 B Int32 dirty flags + 2048 B Float16 data, 256 slots |

Bundler entries are declared in `tsdown.config.ts` and must stay in lockstep with `package.json#exports` — five entries, ESM only, `react`/`react-dom` never bundled.

> [!NOTE]
> `src/shim.ts` is the one entry listed in `package.json#sideEffects` — it installs `globalThis.ResizeObserver` on import. Everything else is side-effect-free and tree-shakeable.

## Development Workflow

### Code Style

This project uses [Biome 2.5.10](https://biomejs.dev/) as the sole linting and formatting tool. No ESLint, no Prettier.

```bash
# Check for issues
npm run lint

# Auto-fix formatting
npm run format
```

`lint` and `format` cover `./src`, `./tests`, and `./bench` — markdown and the `docs/` site are not linted.

> [!NOTE]
> `npm run lint` currently reports around 70 **warnings** and still exits 0. They are all `style/noNonNullAssertion` in test and benchmark code (`tests/` and `bench/`), where non-null assertions on fixture arrays are deliberate. `src/` is warning-clean — keep it that way, and don't treat the existing warnings as a signal that you broke something.

A `simple-git-hooks` pre-commit hook runs `biome check --staged`, so `npm install` (which triggers `prepare` → `simple-git-hooks`) wires formatting enforcement into your commits.

### TypeScript

We target **TypeScript 6** with the strictest possible configuration:

- `erasableSyntaxOnly: true` — all syntax must be strippable by Node 26
- `isolatedDeclarations: true` — enables parallel DTS generation
- `verbatimModuleSyntax: true` — required by the TS 7 native compiler

Verify with both compilers:

```bash
npm run typecheck      # TypeScript 6 (tsc)
npm run typecheck:ts7  # TypeScript 7 native preview
```

### Testing

Three-tier testing architecture. `vitest.config.ts` declares five projects across those tiers:

| Project | Files | Environment | Purpose |
|---------|-------|-------------|---------|
| `unit` | `tests/unit/**/*.test.ts` | happy-dom | Pool, scheduler, extraction, hooks, SSR |
| `compiler` | `tests/compiler/**/*.test.tsx` | happy-dom + React Compiler Babel plugin | Proves the hooks survive auto-memoization |
| `browser:chromium` | `tests/browser/**/*.test.tsx` | Playwright Chromium | Real layout engine |
| `browser:firefox` | `tests/browser/**/*.test.tsx` | Playwright Firefox | Real layout engine |
| `browser:webkit` | `tests/browser/**/*.test.tsx` | Playwright WebKit | Real layout engine |

```bash
npm run test                       # Every project (unit + compiler + all 3 browsers)
npx vitest run --project unit      # Unit only (happy-dom) — what the CI unit-test job runs
npx vitest run --project compiler  # React Compiler compatibility
npm run test:browser               # All three browser projects
npm run test:coverage -- --project unit  # Coverage (V8 coverage requires a non-browser project)
```

Coverage thresholds are enforced by `vitest.config.ts`: **95% lines / 95% functions / 95% statements / 85% branches** (current: ~98% lines, 100% functions — the only gap is the untestable `FinalizationRegistry` GC callback in `pool.ts`). `src/worker/**`, `src/shim/**`, `src/index.ts`, and `src/types.ts` are excluded from the coverage report.

> [!NOTE]
> Run coverage with `--project unit` — the V8 coverage provider cannot run together with the Playwright browser projects.

> [!IMPORTANT]
> `tests/comparison/` and `tests/e2e/` are **not** matched by any project's `include` glob, so `npm run test` does not run them. Invoke them explicitly (or add a project) if you touch them — do not assume a green `npm run test` covered those files.

### Bundle Size

Bundle size is enforced by [size-limit 13.0.3](https://github.com/ai/size-limit) via `.size-limit.json`:

| Entry | Limit | Current (min+gzip) |
|-------|-------|--------------------|
| Main (`useResizeObserver`) | 1.2 kB | 1.12 kB |
| Worker | 1.5 kB | 1.17 kB |
| Shim | 1.5 kB | 527 B |
| Core | 500 B | 329 B |
| Server | 300 B | 115 B |

```bash
npm run size
```

### Benchmarks

```bash
npm run bench
```

Runs the five [tinybench](https://github.com/tinylibs/tinybench) suites in `bench/` (`pool`, `scheduler`, `hook`, `worker`, `memory`) and writes JSON into `bench/results/`.

`.gitignore` keeps `bench/results/*.json` untracked **except** `baseline.json`, which is the committed reference. `.github/workflows/bench.yml` re-runs the suites on every push and PR, uploads the results as an artifact, and posts them as a PR comment table.

> [!NOTE]
> CI reports benchmark numbers; it does not fail on regressions and does not diff against `baseline.json`. `scripts/bench-compare.mjs` is a manual helper and is not wired into any npm script or workflow — compare deliberately when perf matters to your change.

## Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Write tests for new functionality
4. Ensure all checks pass (see PR template checklist)
5. Submit a pull request

### What CI Enforces

`.github/workflows/ci.yml` runs on every push to `main` / `release/*` and every PR into `main`. All jobs pin Node 25.

| Job | Runs on | Gate |
|-----|---------|------|
| **Lint & Type-check** | ubuntu / windows / macOS | `biome check`, `tsc --noEmit`, `tsgo --noEmit`, `build`, `publint` |
| **Unit Tests** | ubuntu / windows / macOS | `vitest --project unit --coverage` (Codecov upload on ubuntu PRs) |
| **Browser Tests** | ubuntu | One job per browser: chromium, firefox, webkit |
| **Bundle Size** | ubuntu | `size-limit` against `.size-limit.json`; PR comment via `size-limit-action` |
| **Security Audit** | ubuntu | `npm audit --omit=dev` |
| **Socket Security** | ubuntu, PRs only | Supply-chain review |

Lint and type-check gate everything: unit, browser, and size all declare `needs: quality`, so a lint failure stops the rest of the run.

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add border-box support
fix: correct DPR calculation in Worker mode
docs: update SSR guide
perf: optimize pool observe throughput
test: add Shadow DOM integration test
chore: update TypeScript to 6.0.1
```

### Changesets

For user-facing changes, add a changeset:

```bash
npx changeset
```

## Release Process

### Automated (CI)

The release workflow (`.github/workflows/release.yml`) triggers on `v*` tag pushes:

1. `npm audit --omit=dev` — security gate
2. `npm run build` — build all entries
3. `npm run test -- --project unit` — run unit tests
4. `npm run size` — verify bundle size limits
5. `npx publint` — verify package exports
6. `npm pack --dry-run` — verify file inclusions
7. `npm publish --provenance --access public` — publish with provenance

> [!NOTE]
> The workflow publishes with plain `npm publish --provenance`. The `npm run release` script (`changeset publish --provenance`) exists for a manual publish from a clean checkout and is **not** what CI runs — changesets are used for versioning and changelog entries, not for the automated publish step.

### Manual Release Checklist

For every new release, complete ALL of the following.

**1 — Bump the version in every place it is written**

- [ ] `version` in `package.json`
- [ ] The version label in the `docs/.vitepress/config.ts` `nav` dropdown
- [ ] `CHANGELOG.md` (root) — new entry
- [ ] `docs/changelog.md` (VitePress mirror) — matching entry
- [ ] `SECURITY.md` **and** `.github/SECURITY.md` — both carry a supported-versions table, and both must be updated
- [ ] `docs/api/index.md` if the public API changed (hand-maintained — see [Documentation](#documentation))
- [ ] `README.md` if features or bundle sizes changed

**2 — Ship it**

- [ ] Commit: `git commit -m "feat: release vX.Y.Z — <summary>"`
- [ ] Tag and push: `git tag vX.Y.Z && git push origin main vX.Y.Z`
- [ ] Watch the release workflow: `gh run watch`
- [ ] Create the GitHub release: `gh release create vX.Y.Z --generate-notes`

**3 — Verify downstream**

- [ ] Wiki: `git clone https://github.com/ABCrimson/use-resize-observer.wiki.git`, update the version in `Home.md`, commit and push
- [ ] Registry: `npm info @crimson_dev/use-resize-observer` shows the new version
- [ ] Site: [abcrimson.github.io/use-resize-observer](https://abcrimson.github.io/use-resize-observer/) redeployed by `docs.yml`

> [!IMPORTANT]
> Pushing the tag is what triggers publishing. `git push origin main` alone deploys docs but publishes nothing.

## Documentation

Full documentation is available at **[abcrimson.github.io/use-resize-observer](https://abcrimson.github.io/use-resize-observer/)**.

The site is [VitePress](https://vitepress.dev/) sourced from `docs/`, configured in `docs/.vitepress/config.ts`.

| Command | What it runs | Use it for |
|---------|--------------|------------|
| `npm run docs:dev` | `vitepress dev docs` | Local authoring with hot reload |
| `npm run docs:build` | `typedoc && vitepress build docs` | Full local build **including** generated API pages |
| `npm run docs:preview` | `vitepress preview docs` | Serving the built output |

> [!WARNING]
> **`npm run docs:build` overwrites `docs/api/index.md`.** `typedoc.json` sets `"out": "docs/api"`, and the VitePress theme writes its own `index.md` there — clobbering the hand-maintained API page that is tracked in git. If you run `docs:build` locally, check `git status` afterwards and revert `docs/api/` unless you intended to regenerate it.

> [!NOTE]
> The deploy workflow (`.github/workflows/docs.yml`) runs `npx vitepress build docs` directly — **not** `npm run docs:build` — so typedoc does not run in CI and the published API page is the hand-maintained `docs/api/index.md`. Keep that file in sync by hand when the public API changes.

Sidebar navigation is declared in `docs/.vitepress/config.ts`. Adding a page under `docs/guide/` does **not** surface it automatically — add it to the `sidebar['/guide/']` group as well.

## Architecture Overview

See the [Architecture Guide](https://abcrimson.github.io/use-resize-observer/guide/architecture) for a detailed explanation, or the source at [docs/guide/architecture.md](./docs/guide/architecture.md).

## Code of Conduct

Be respectful, constructive, and welcoming. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).
