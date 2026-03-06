# Contributing to @crimson_dev/use-resize-observer

Thank you for your interest in contributing!

## Development Setup

### Prerequisites

- **Node.js 25+** (install via [nvm](https://github.com/nvm-sh/nvm))
- **npm 11+** (ships with Node 25)

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

## Development Workflow

### Code Style

This project uses [Biome 2.4.6](https://biomejs.dev/) as the sole linting and formatting tool. No ESLint, no Prettier.

```bash
# Check for issues
npm run lint

# Auto-fix formatting
npm run format
```

### TypeScript

We target **TypeScript 6** with the strictest possible configuration:

- `erasableSyntaxOnly: true` — all syntax must be strippable by Node 25
- `isolatedDeclarations: true` — enables parallel DTS generation
- `verbatimModuleSyntax: true` — forward-compatible with TS 7

Verify with both compilers:

```bash
npm run typecheck      # TypeScript 6
npm run typecheck:ts7  # TypeScript 7 native preview
```

### Testing

Three-tier testing architecture:

```bash
npm run test                    # All unit tests (happy-dom)
npm run test:browser            # Browser tests (Chromium/Firefox/WebKit)
npm run test:coverage           # Coverage report (100% required)
```

### Bundle Size

Bundle size is enforced by [size-limit 12.0.0](https://github.com/ai/size-limit):

| Entry | Limit |
|-------|-------|
| Main (`useResizeObserver`) | 1.12 kB gzip |
| Worker | 1.21 kB gzip |
| Core | 350 B gzip |
| Server | 114 B gzip |
| Shim | 537 B gzip |

```bash
npm run size
```

### Benchmarks

```bash
npm run bench
```

Results are stored in `bench/results/` and compared in CI.

## Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Write tests for new functionality
4. Ensure all checks pass (see PR template checklist)
5. Submit a pull request

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

Releases are automated via [Changesets](https://github.com/changesets/changesets):

1. PRs include changeset entries describing the change
2. On merge to `main`, the release workflow runs
3. `changeset version` bumps versions and updates CHANGELOG
4. `changeset publish --provenance` publishes to npm with provenance

### NPM Token

The `NPM_TOKEN` secret must be configured in the repository settings for automated publishing.

## Documentation

Full documentation is available at **[abcrimson.github.io/use-resize-observer](https://abcrimson.github.io/use-resize-observer/)**.

## Architecture Overview

See the [Architecture Guide](https://abcrimson.github.io/use-resize-observer/guide/architecture) for a detailed explanation, or the source at [docs/guide/architecture.md](./docs/guide/architecture.md).

## Code of Conduct

Be respectful, constructive, and welcoming. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).
