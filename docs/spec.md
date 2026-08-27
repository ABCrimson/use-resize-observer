# `@crimson_dev/use-resize-observer`
## Complete 2026 Remaster — Engineering Specification & Version Roadmap

> **Package:** `@crimson_dev/use-resize-observer`  
> **Starts at:** `0.0.1`  
> **Stable release target:** `1.0.0`  
> **Philosophy:** ESNext-first · Zero runtime deps · Worker-native · WASM-optional · Sub-300B gzip · React 19 Compiler-safe  
> **Specification epoch:** March 2026

---

## Table of Contents

1. [Package Identity](#1-package-identity)
2. [Exact Dependency Manifest](#2-exact-dependency-manifest)
3. [Stack Corrections & Version Commentary](#3-stack-corrections--version-commentary)
4. [ESNext Architecture Foundation](#4-esnext-architecture-foundation)
5. [Performance Architecture — Concurrency, Threading, Scheduling](#5-performance-architecture--concurrency-threading-scheduling)
6. [Complete Version Roadmap — 0.0.1 → 1.0.0](#6-complete-version-roadmap--001--100)
7. [TypeScript 6 + TS7 Native Preview Configuration](#7-typescript-6--ts7-native-preview-configuration)
8. [Build System — tsdown 0.21.0-beta](#8-build-system--tsdown-0210-beta)
9. [Core API Architecture](#9-core-api-architecture)
10. [Worker Threading Architecture](#10-worker-threading-architecture)
11. [Testing Architecture — Vitest 4.1 + Playwright Alpha](#11-testing-architecture--vitest-41--playwright-alpha)
12. [Documentation System — VitePress 2.0 Alpha + Shiki 4](#12-documentation-system--vitepress-20-alpha--shiki-4)
13. [GitHub Automation & CI/CD](#13-github-automation--cicd)
14. [Aesthetics System — OKLCH · Mesh Gradients · View Transitions](#14-aesthetics-system--oklch--mesh-gradients--view-transitions)
15. [Repository File Structure](#15-repository-file-structure)
16. [ESNext Feature Matrix](#16-esnext-feature-matrix)
17. [Performance Benchmark Targets](#17-performance-benchmark-targets)

---

## 1. Package Identity

```
Scope:       @crimson_dev
Package:     @crimson_dev/use-resize-observer
Registry:    https://registry.npmjs.org
License:     MIT
Initial:     0.0.1
Stable:      1.0.0
Repository:  https://github.com/crimson-dev/use-resize-observer
Docs:        https://crimson-dev.github.io/use-resize-observer
```

### Naming Rationale

The `@crimson_dev` scope signals first-party ownership and distinguishes the package from the upstream `use-resize-observer` package it spiritually succeeds. The package name itself is kept identical to the upstream so that the migration story is a one-line `package.json` edit for existing consumers.

---

## 2. Exact Dependency Manifest

Every version below is pinned to the exact latest available as of March 5, 2026, per the provided npm URLs.

```json
{
  "name": "@crimson_dev/use-resize-observer",
  "version": "0.0.1",
  "description": "Zero-dependency, Worker-native, ESNext-first React 19 ResizeObserver hook",
  "type": "module",
  "sideEffects": false,
  "license": "MIT",
  "author": {
    "name": "Crimson Dev",
    "url": "https://github.com/crimson-dev"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/crimson-dev/use-resize-observer.git"
  },
  "keywords": [
    "react",
    "hook",
    "resize",
    "ResizeObserver",
    "typescript",
    "esm",
    "worker",
    "performance"
  ],
  "exports": {
    ".": {
      "types":  "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./worker": {
      "types":  "./dist/worker.d.ts",
      "import": "./dist/worker.js"
    },
    "./shim": {
      "types":  "./dist/shim.d.ts",
      "import": "./dist/shim.js"
    },
    "./server": {
      "types":  "./dist/server.d.ts",
      "import": "./dist/server.js"
    },
    "./package.json": "./package.json"
  },
  "main":   "./dist/index.js",
  "module": "./dist/index.js",
  "types":  "./dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  "engines": {
    "node": ">=25.0.0"
  },
  "dependencies": {},
  "peerDependencies": {
    "react": ">=19.3.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": false }
  },
  "devDependencies": {
    "typescript":                   "6.0.0-dev.20260305",
    "@typescript/native-preview":   "7.0.0-dev.20260305.1",
    "tsdown":                       "0.21.0-beta.5",
    "@biomejs/biome":               "2.4.5",
    "vitest":                       "4.1.0-beta.5",
    "@vitest/browser-playwright":   "4.1.0-beta.5",
    "@vitest/coverage-v8":          "4.1.0-beta.5",
    "@vitest/ui":                   "4.1.0-beta.5",
    "@testing-library/react":       "16.3.2",
    "@testing-library/user-event":  "14.6.1",
    "playwright":                   "1.59.0-alpha-2026-03-05",
    "happy-dom":                    "20.8.3",
    "react":                        "19.3.0-canary-3bc2d414-20260304",
    "react-dom":                    "19.3.0-canary-3bc2d414-20260304",
    "@types/react":                 "19.2.14",
    "@types/react-dom":             "19.2.3",
    "vitepress":                    "2.0.0-alpha.16",
    "typedoc":                      "0.28.17",
    "typedoc-plugin-markdown":      "4.10.0",
    "typedoc-vitepress-theme":      "1.1.2",
    "shiki":                        "4.0.1",
    "tinybench":                    "6.0.0",
    "@changesets/cli":              "2.30.0",
    "size-limit":                   "12.0.0",
    "@size-limit/preset-small-lib": "12.0.0",
    "svgo":                         "4.0.1",
    "tsx":                          "4.21.0",
    "concurrently":                 "9.2.1"
  }
}
```

---

## 3. Stack Corrections & Version Commentary

The following table documents every deviation from the previous plan, grounded in the npm version URLs provided.

### 3.1 Critical Version Upgrades From Previous Plan

| Package | Previous Plan | Actual Latest (Mar 2026) | Impact |
|---------|--------------|--------------------------|--------|
| `node` engine | `>=22.0.0` | **`>=25.0.0`** | Node 25 ships native type-stripping stable, `require(esm)` stable, and the V8 version supporting all ES2026 features including `Float16Array`, `Temporal`, `RegExp.escape()`, `Promise.try()` |
| `tsdown` | `^0.20.3` | **`0.21.0-beta.5`** | Beta adds `isolatedDeclarations` DTS mode with full Rolldown 2.x core; measurably faster than 0.20.x |
| `@biomejs/biome` | `^2.4.2` | **`2.4.5`** | Patch includes Playwright rule improvements and HTML formatter fixes |
| `vitest` | `^4.0.18` | **`4.1.0-beta.5`** | Beta adds `--detect-async-leaks` stable, `toMatchScreenshot` cross-browser, and the new `createSpecification` API |
| `@vitest/browser-playwright` | `^4.0.18` | **`4.1.0-beta.5`** | Matches Vitest beta; persistent context support |
| `playwright` | `^1.52.0` | **`1.59.0-alpha-2026-03-05`** | Alpha includes WebAssembly module interception, `toBeInViewport` ratio assertions, and Frame locator improvements |
| `happy-dom` | `^16.0.0` | **`20.8.3`** | Massive jump; 20.x rewrites the event loop model, adds `ResizeObserver` with far better spec fidelity than 16.x |
| `vitepress` | `^1.6.0` *(previous plan was wrong)* | **`2.0.0-alpha.16`** | VitePress 2 alpha is live; built on Vite 6 + Rolldown. Introduces component islands, Shiki 4, and the new theme API |
| `shiki` | `^2.0.0` *(previous plan was wrong)* | **`4.0.1`** | Shiki 4 is a ground-up rewrite — universal JS (no WASM fallback), streaming tokenizer, `@shikijs/core` tree-shakeable core, 50% smaller than Shiki 2 |
| `tinybench` | `^2.9.0` | **`6.0.0`** | Major rewrite in v6; async-first, Worker-aware, native `Performance.measure()` integration |
| `size-limit` | `^11.0.0` | **`12.0.0`** | v12 adds Rolldown analysis backend and ESM-native import tracing |
| `@size-limit/preset-small-lib` | `^11.0.0` | **`12.0.0`** | Matches size-limit |
| `svgo` | `^3.3.2` *(previous plan; original was wrong about 4)* | **`4.0.1`** | SVGO 4 is out; ESM-only, drops Node < 20, new plugin API |
| `typedoc-plugin-markdown` | `^4.3.0` | **`4.10.0`** | Major stability improvements for VitePress 2 sidebar generation |

### 3.2 Node 25 Implications for This Library

Targeting Node `>=25.0.0` for the **dev toolchain** (not the runtime target) unlocks:

- **Native TypeScript type stripping** — `node --experimental-strip-types` is now stable in Node 25; `tsx` is still preferred for sourcemap quality but is not strictly required for simple scripts.
- **`require(esm)` stable** — eliminates the CJS interop shim problem entirely for tooling that loads our config files.
- **V8 13.x** — full ES2026 support including `Temporal`, `Float16Array`, `Promise.try()`, `RegExp.escape()`, `Iterator.prototype` methods, and `Math.sumPrecise()`.
- **`node:worker_threads`** with `SharedArrayBuffer` enabled by default without `--experimental` flags.
- **Built-in `fetch()`** stable with streaming body support — used in our benchmark HTTP polling.

> Note: The library's **runtime target** remains `ES2026` with browser-compatible APIs. Node 25 is only the minimum for the **development environment** (build scripts, test runners, docs server).

### 3.3 VitePress 2.0 Alpha Architecture Changes

VitePress 2.0-alpha.16 introduces breaking changes from 1.x that affect our docs config:

- **New theme API**: `defineTheme()` replaces direct theme object mutation.
- **Component islands**: Lazy-hydrated components via `ClientOnly` now use the Islands pattern — critical for embedding the live resize visualizer without SSR errors.
- **Shiki 4 built-in**: No longer needs manual `markdown.theme` config; uses `createHighlighter()` from Shiki 4 internally.
- **Rolldown bundler**: VitePress 2 uses Vite 6+ which runs on Rolldown in production — docs builds are now 3-5× faster.
- **`vitepress dev` watch**: Rebuilds in < 50ms on changes via Rolldown HMR.

### 3.4 Shiki 4 Integration Notes

Shiki 4 (`4.0.1`) is architecturally different from Shiki 2:

```typescript
// Shiki 4 — streaming, tree-shakeable, no WASM loading delay
import { createHighlighter } from 'shiki/core';
import { bundledLanguages } from 'shiki/bundle/full';

// All synchronous after first await; no per-highlight async
const highlighter = await createHighlighter({
  themes: ['github-dark-dimmed', 'github-light'],
  langs: [bundledLanguages.typescript, bundledLanguages.bash],
});
```

The key performance win: Shiki 4's grammar engine is pure JS (no WASM), so it initializes synchronously in Node 25 worker threads, enabling parallel syntax highlighting of all code blocks in documentation build.

### 3.5 tinybench 6.0.0 Architecture Changes

`tinybench` v6 is a ground-up rewrite with a Worker-aware benchmark runner:

```typescript
// tinybench 6 — Worker-native benchmarking
import { Bench } from 'tinybench';

const bench = new Bench({
  time:      1000,        // ms per benchmark
  warmupTime: 500,
  now:       performance.now,
  // v6: runs in a Worker for isolation from GC pauses
  worker:    true,
});
```

---

## 4. ESNext Architecture Foundation

Every line of source code must use the most current ES2026 idioms available in Node 25 / V8 13.x. This section defines the ESNext baseline.

### 4.1 ES2026 Feature Usage Matrix

| Feature | Stage | Usage in This Library |
|---------|-------|-----------------------|
| `using` / `await using` (Explicit Resource Management) | ES2026 | `ObserverPool` entries, Worker ports, test cleanup |
| `Promise.try()` | ES2026 | Safe async initialization in `getSharedObserver()` |
| `Math.sumPrecise()` | ES2026 | Sub-pixel coordinate accumulation in WASM shim |
| `RegExp.escape()` | ES2026 | Benchmark label sanitization |
| `Float16Array` | ES2026 | SharedArrayBuffer layout for Worker measurement protocol |
| `Iterator.prototype` methods (`map`, `filter`, `take`, `drop`) | ES2026 | Pool registry traversal without intermediate arrays |
| `Temporal` API | ES2026 | Benchmark timestamps (replaces `Date.now()` and `performance.now()` in bench scripts) |
| `Error.isError()` | ES2026 | Centralized error detection in Worker message handler |
| Decorator Metadata | ES2026 | TypeDoc annotation helpers (dev only) |
| `structuredClone()` | ES2022+ (now baseline) | Worker message serialization of `ResizeObserverEntry` data |
| `WeakRef` + `FinalizationRegistry` | ES2021+ (now baseline) | GC-backed pool cleanup |
| `Array.fromAsync()` | ES2024 | Async batch processing in test utilities |
| `Object.groupBy()` | ES2024 | Benchmark result aggregation by browser |
| `Promise.withResolvers()` | ES2024 | Worker protocol handshake |
| Top-level `await` | ES2022+ (module) | Shim loader, Worker initialization |
| `import.meta.resolve()` | ES2023 | Worker script URL resolution |

### 4.2 Code Style Contract

All source files are governed by the following non-negotiable style rules, enforced by Biome 2.4.5:

```
✅ ALWAYS                              ❌ NEVER
─────────────────────────────────────  ─────────────────────────────────────
import type { T } from '...'           import { T } from '...' (type-only)
using pool = getPool(...)              pool.dispose() in finally
const x = await Promise.try(fn)        try { const x = await fn() } catch...
for (const entry of entries)           entries.forEach(...)
new Map() / new Set() / WeakMap        plain objects for collections
#privateField                          _privateField convention
satisfies Constraint                   as Constraint (type assertions)
const fn = (...): ReturnType => {}     function fn(...): ReturnType {}
export type { T }                      export { T } (type re-export)
'use client'; at top of hook files     nothing (RSC boundary must be explicit)
```

### 4.3 Module System

```
Source:     .ts (TypeScript 6, ESM modules)
Output:     .js (ESM only, no CJS)
Extensions: .js in import paths (TypeScript bundler resolution)
Protocol:   NodeNext module resolution in tsconfig
Top-level:  await allowed (ES modules)
Dynamic:    import() for optional WASM shim only
```

---

## 5. Performance Architecture — Concurrency, Threading, Scheduling

This section defines the complete multi-layered performance strategy — from V8 microtask scheduling through Web Worker threading to optional WASM acceleration.

### 5.1 Scheduling Hierarchy

```
Layer 0: ResizeObserver native callback (browser scheduler, ~8ms budget)
   │
   ▼
Layer 1: Entry Deduplication (Map<Element, Entry> — last-write-wins per frame)
   │
   ▼
Layer 2: RequestAnimationFrame Batcher (coalesces all Layer-1 entries)
   │
   ▼
Layer 3: React `startTransition` wrapper (non-urgent state updates)
   │
   ▼
Layer 4: React Scheduler (batched re-renders via React 19 automatic batching)
   │
   ▼
Layer 5: Paint (single frame, regardless of how many elements resized)
```

**Key principle:** An application with 100 observed elements that all resize simultaneously produces exactly 1 React render cycle and 1 paint, not 100.

### 5.2 Concurrency Model — Main Thread

```typescript
// Internal scheduler — not exported, lives in src/scheduler.ts

// Uses a single rAF loop that is started lazily and stopped when idle.
// Uses a Map (ordered insertion) to ensure deterministic callback ordering.
// Uses React's startTransition to mark resize updates as non-urgent,
// preventing them from blocking user input handling.

import { startTransition } from 'react';

type FlushEntry = {
  readonly callbacks: ReadonlySet<ResizeCallback>;
  readonly entry:     ResizeObserverEntry;
};

class RafScheduler {
  readonly #queue   = new Map<Element, FlushEntry>();
  readonly #pending = new Set<FrameRequestCallback>();
  #rafId: number | null = null;

  schedule(target: Element, entry: ResizeObserverEntry, cbs: Set<ResizeCallback>): void {
    // Last-write-wins: if element already queued, replace with latest entry
    this.#queue.set(target, { callbacks: cbs, entry });
    this.#requestFlush();
  }

  #requestFlush(): void {
    if (this.#rafId !== null) return;          // Already scheduled
    this.#rafId = requestAnimationFrame(() => {
      this.#rafId = null;
      this.#flush();
    });
  }

  #flush(): void {
    // Snapshot the queue and clear before iterating — handles re-entrant resizes
    const snapshot = new Map(this.#queue);
    this.#queue.clear();

    // Wrap all state updates in startTransition:
    // resize callbacks are never urgent — user interaction must not be blocked
    startTransition(() => {
      for (const { callbacks, entry } of snapshot.values()) {
        for (const cb of callbacks) {
          cb(entry);
        }
      }
    });
  }

  cancel(): void {
    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
    this.#queue.clear();
  }
}

// Singleton per document root
export const createScheduler = (): RafScheduler => new RafScheduler();
```

### 5.3 Concurrency Model — Worker Thread

The `/worker` subpath export moves all `ResizeObserver` measurement off the main thread using a structured protocol:

```
Main Thread                          Worker Thread
────────────────────────────────     ────────────────────────────────
useResizeObserverWorker(ref)
  │
  ├─ postMessage({ op: 'observe',  ──► ResizeObserver.observe(element)
  │    elementId, transferable })       (via OffscreenCanvas proxy)
  │
  │◄── Atomics.waitAsync(sab, idx)  ◄── Atomics.notify(sab, idx)
  │    [non-blocking on main thread]     (written after each measurement)
  │
  ├─ rAF loop reads SAB             ──  Float16Array layout:
  │  → React setState                    [inlineSize, blockSize,
  └─ paint                               borderInline, borderBlock]
```

**SharedArrayBuffer layout per observed element:**

```typescript
// src/worker/protocol.ts
// 4 Float16 values × 2 bytes = 8 bytes per element slot
// Float16Array: ES2026 baseline, native in V8 13 / Node 25

const SLOT_BYTES   = 8;   // 4 × Float16 (2 bytes each)
const MAX_ELEMENTS = 256; // Hard cap; sufficient for any realistic component tree

export const SAB_SIZE = SLOT_BYTES * MAX_ELEMENTS; // 2 KB total

export const enum SlotOffset {
  InlineSize  = 0,
  BlockSize   = 1,
  BorderInline = 2,
  BorderBlock  = 3,
}

export function writeSlot(sab: SharedArrayBuffer, slotId: number, entry: ResizeObserverEntry): void {
  const view = new Float16Array(sab, slotId * SLOT_BYTES, 4);
  const [cs] = entry.contentBoxSize;
  const [bs] = entry.borderBoxSize;
  view[SlotOffset.InlineSize]   = cs?.inlineSize  ?? 0;
  view[SlotOffset.BlockSize]    = cs?.blockSize    ?? 0;
  view[SlotOffset.BorderInline] = bs?.inlineSize   ?? 0;
  view[SlotOffset.BorderBlock]  = bs?.blockSize    ?? 0;
  Atomics.notify(new Int32Array(sab), slotId, 1);
}

export function readSlot(sab: SharedArrayBuffer, slotId: number): {
  width:        number;
  height:       number;
  borderWidth:  number;
  borderHeight: number;
} {
  const view = new Float16Array(sab, slotId * SLOT_BYTES, 4);
  return {
    width:        view[SlotOffset.InlineSize]!,
    height:       view[SlotOffset.BlockSize]!,
    borderWidth:  view[SlotOffset.BorderInline]!,
    borderHeight: view[SlotOffset.BorderBlock]!,
  };
}
```

### 5.4 Pool Architecture — Shared Observer

```typescript
// src/pool.ts — internal

class ObserverPool implements Disposable {
  readonly #scheduler  = createScheduler();
  readonly #registry   = new WeakMap<Element, Set<ResizeCallback>>();
  readonly #finalizer  = new FinalizationRegistry<WeakRef<Element>>((ref) => {
    const el = ref.deref();
    if (el) this.#observer.unobserve(el);
  });
  readonly #observer: ResizeObserver;
  #size = 0;

  constructor() {
    this.#observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const callbacks = this.#registry.get(entry.target);
        if (callbacks?.size) {
          this.#scheduler.schedule(entry.target, entry, callbacks);
        }
      }
    });
  }

  observe(target: Element, options: ResizeObserverOptions, cb: ResizeCallback): void {
    using _ = this.#acquireLock(); // ES2026 Explicit Resource Management
    if (!this.#registry.has(target)) {
      this.#registry.set(target, new Set());
      this.#finalizer.register(target, new WeakRef(target), target);
      this.#observer.observe(target, options);
      this.#size++;
    }
    this.#registry.get(target)!.add(cb);
  }

  unobserve(target: Element, cb: ResizeCallback): void {
    using _ = this.#acquireLock();
    const callbacks = this.#registry.get(target);
    if (!callbacks) return;
    callbacks.delete(cb);
    if (callbacks.size === 0) {
      this.#registry.delete(target);
      this.#observer.unobserve(target);
      this.#size--;
    }
  }

  get observedCount(): number { return this.#size; }

  // Disposable contract (ES2026 explicit resource management)
  [Symbol.dispose](): void {
    this.#observer.disconnect();
    this.#scheduler.cancel();
  }

  // Lightweight advisory lock for synchronous critical sections
  #acquireLock(): Disposable {
    return { [Symbol.dispose](): void {} };
  }
}
```

### 5.5 Graphics Processing — GPU-Accelerated Resize Visualizer

The demo site's resize visualizer uses the following GPU-acceleration strategy:

- **CSS `will-change: transform`** on measurement bars — promotes to compositor layer.
- **CSS `transform: scaleX()` / `scaleY()`** for bar resizing — GPU-composited, zero layout cost.
- **`OffscreenCanvas` + `ImageBitmap`** for the heatmap overlay — renders in a Worker, transfers to main thread via `transferFromImageBitmap()`.
- **`CSS.paintWorklet`** (Houdini) for the mesh gradient animation — runs on compositor thread without main-thread involvement.
- **View Transitions API** (`document.startViewTransition()`) for panel state changes — hardware-interpolated by the browser.
- **`ResizeObserver` with `devicePixelContentBoxSize`** on the visualizer canvas itself, for pixel-perfect sub-pixel rendering at any DPR.

---

## 6. Complete Version Roadmap — 0.0.1 → 1.0.0

Every version increment is a deliberately scoped, atomic delivery. Each version must pass all existing tests before merging; no version may include more work than what is listed.

---

### EPOCH 0.0.x — Repository Foundation

**Theme:** Scaffold the entire project skeleton correctly before writing a single line of library logic. A flawed scaffold creates technical debt across every subsequent version.

---

#### `0.0.1` — Repository Initialization

**Deliverables:**
- Initialize npm workspace with `@crimson_dev` scope
- `package.json` with exact versions from §2, `"type": "module"`, `"sideEffects": false`
- `.npmrc` with `//registry.npmjs.org/:_authToken` placeholder
- `.nvmrc` → `25`
- `node_modules` install verified clean with `npm ci`
- MIT `LICENSE`
- `.gitignore` (node_modules, dist, .DS_Store, *.tsbuildinfo, .env)
- Initial `git init` + first commit `chore: init @crimson_dev/use-resize-observer`
- GitHub repository created, `main` branch protected

**Quality gate:** `npm install` exits `0`. No `package-lock.json` conflicts.

---

#### `0.0.2` — TypeScript 6 Configuration

**Deliverables:**
- `tsconfig.json` with full TS 6 strict baseline (see §7)
- `tsconfig.build.json` extending base for tsdown input
- `tsconfig.test.json` extending base for Vitest test environment
- `src/` directory with stub `index.ts` (exports empty object)
- Verify `tsc --noEmit` exits `0` on stubs
- Verify `npx @typescript/native-preview --noEmit` exits `0` (TS 7 native preview)

**Key tsconfig decisions made at this version:**
- `"target": "ESNext"` — not `"ES2026"` string; `"ESNext"` always tracks the absolute latest V8 target in the installed TypeScript version
- `"lib": ["ESNext", "DOM", "DOM.Iterable", "WebWorker"]`
- `"isolatedDeclarations": true` — mandatory; enables parallel DTS generation in tsdown
- `"verbatimModuleSyntax": true` — mandatory for TS 7 forward-compat
- `"exactOptionalPropertyTypes": true`
- `"noUncheckedIndexedAccess": true`
- `"erasableSyntaxOnly": true` — new TS 6 option; ensures all syntax is strippable by Node 25 native type-stripping

**Quality gate:** Both `tsc --noEmit` and `tsgo --noEmit` pass.

---

#### `0.0.3` — Build System: tsdown 0.21.0-beta.5

**Deliverables:**
- `tsdown.config.ts` (see §8)
- `npm run build` produces `dist/index.js`, `dist/index.d.ts`
- ESM-only output verified: `node --input-type=module -e "import './dist/index.js'"` exits `0`
- No CJS output present in `dist/`
- `dist/` contents verified via `publint` (catches wrong exports map entries)

**Quality gate:** `npm run build` exits `0`. `publint` emits zero warnings.

---

#### `0.0.4` — Linting: Biome 2.4.5

**Deliverables:**
- `biome.json` configuration (see full config below)
- `npm run lint` exits `0` on empty src stubs
- `npm run format` applies Biome formatting
- No ESLint, no Prettier — Biome is the sole linting/formatting tool
- Pre-commit hook via `simple-git-hooks` runs `biome check --staged`
- `.editorconfig` aligned with Biome's formatting rules

**`biome.json`:**
```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.5/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables":       "error",
        "noUnusedImports":         "error",
        "useExhaustiveDependencies": "warn"
      },
      "style": {
        "useConst":            "error",
        "noVar":               "error",
        "useTemplate":         "error",
        "useNullishCoalescing": "error",
        "useOptionalChain":    "error"
      },
      "performance": {
        "noDelete":      "error",
        "noAccumulatingSpread": "error"
      },
      "suspicious": {
        "noExplicitAny":      "error",
        "noDoubleEquals":     "error"
      },
      "complexity": {
        "noBannedTypes":    "error",
        "noExcessiveCognitiveComplexity": {
          "level": "warn",
          "options": { "maxAllowedComplexity": 10 }
        }
      }
    }
  },
  "formatter": {
    "enabled":        true,
    "indentStyle":    "space",
    "indentWidth":    2,
    "lineWidth":      100,
    "lineEnding":     "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle":   "single",
      "trailingCommas": "all",
      "semicolons":   "always"
    }
  }
}
```

**Quality gate:** `biome check ./src ./tests` exits `0`.

---

#### `0.0.5` — Testing Infrastructure: Vitest 4.1.0-beta.5

**Deliverables:**
- `vitest.config.ts` with three-project setup (unit/browser-chromium/browser-firefox/browser-webkit)
- `tests/unit/` directory with one passing smoke test
- `tests/browser/` directory with one passing browser smoke test
- `npm run test` exits `0`
- `npm run test:browser` exits `0` (Playwright browsers installed)
- Coverage report generated to `coverage/`

**Quality gate:** `npm run test -- --coverage` exits `0`. Coverage passes `100%` on stubs.

---

#### `0.0.6` — Size Limit: size-limit 12.0.0

**Deliverables:**
- `.size-limit.json` with 300B limit on main entry, 1KB on worker, 1.5KB on shim
- `npm run size` exits `0` on stubs (stubs are < 50 bytes each)
- CI will fail builds that exceed the thresholds

**Quality gate:** `npm run size` exits `0`.

---

#### `0.0.7` — Changeset & Release Pipeline

**Deliverables:**
- `.changeset/config.json` with `@changesets/cli@2.30.0`
- `npm run release` script configured
- `npm run version` script configured
- `CHANGELOG.md` initialized (empty, to be populated by changesets)
- GitHub `NPM_TOKEN` secret documented in `CONTRIBUTING.md`

**Quality gate:** `npx changeset status` exits `0`.

---

#### `0.0.8` — CI/CD: GitHub Actions

**Deliverables:**
- `.github/workflows/ci.yml` — full matrix (Node 25, TS 6 + TS 7 native preview)
- `.github/workflows/docs.yml` — VitePress 2 build + GitHub Pages deploy
- `.github/workflows/release.yml` — changeset publish on main
- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/ISSUE_TEMPLATE/performance_regression.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/CODEOWNERS`
- `.github/SECURITY.md`

**Quality gate:** CI pipeline passes on an empty push to a feature branch.

---

#### `0.0.9` — Documentation Skeleton: VitePress 2.0.0-alpha.16

**Deliverables:**
- `docs/` directory initialized with VitePress 2 config (see §12)
- OKLCH color token CSS file (`docs/.vitepress/theme/tokens.css`)
- Variable font setup (Geist, Geist Mono via Google Fonts)
- Hero section in `docs/index.md`
- Navigation and sidebar skeleton
- `npm run docs:dev` starts VitePress dev server at `localhost:5173`
- TypeDoc pipeline generates stub API docs

**Quality gate:** `npm run docs:build` exits `0`. Output is valid HTML.

---

### EPOCH 0.1.x — Observer Pool Core

**Theme:** Build the shared observer pool and its scheduler — the most performance-critical internal component. This epoch produces no user-facing API; it is infrastructure only.

---

#### `0.1.0` — `ObserverPool` Class

**Deliverables:**
- `src/pool.ts` — complete `ObserverPool` implementation
  - `WeakMap<Element, Set<ResizeCallback>>` internal registry
  - `FinalizationRegistry` for GC-backed cleanup
  - `[Symbol.dispose]()` implementing `Disposable` interface
  - `observe(target, options, cb)` method
  - `unobserve(target, cb)` method
  - `get observedCount()` accessor
- Zero imports from React (pool is framework-agnostic)
- Full JSDoc on all public methods

**Quality gate:** Unit tests pass. `observedCount` correctly tracks observed elements.

---

#### `0.1.1` — Pool Factory & Root Registry

**Deliverables:**
- `src/pool.ts` extended with `getSharedPool(root: Document | ShadowRoot): ObserverPool`
- `WeakMap<Document | ShadowRoot, ObserverPool>` module-level registry
- Shadow DOM support verified: separate pool per shadow root
- `Promise.try()` wrapping pool initialization for safe async-context creation

**Quality gate:** Two hooks in the same document share one pool instance. Two hooks in different shadow roots get separate pool instances.

---

#### `0.1.2` — rAF Scheduler

**Deliverables:**
- `src/scheduler.ts` — `RafScheduler` class
  - Lazy `requestAnimationFrame` start
  - `Map<Element, FlushEntry>` deduplicated queue (last-write-wins)
  - `startTransition` wrapping for non-urgent React updates
  - Idle detection: `cancelAnimationFrame` when queue is empty
  - `[Symbol.dispose]()` contract

**Quality gate:** 100 simultaneous resize events produce exactly 1 `rAF` callback invocation. `startTransition` is called exactly once per flush.

---

#### `0.1.3` — Pool + Scheduler Integration

**Deliverables:**
- `ObserverPool` constructor wired to `RafScheduler`
- Integration test: observe 50 elements, trigger all resizes, assert 1 rAF flush
- Memory profile test: 1000 observe/unobserve cycles show no heap growth

**Quality gate:** Memory profile shows `0` leaked `WeakMap` entries after full cleanup cycle.

---

#### `0.1.4` — FinalizationRegistry Cleanup Verification

**Deliverables:**
- Test harness for `FinalizationRegistry` using `node --expose-gc`
- Test verifies that detached elements are eventually removed from the pool
- `ObserverPool.#size` correctly decrements after GC

**Quality gate:** After forced GC, `observedCount` returns `0` for a pool whose all elements are unreachable.

---

#### `0.1.5` — Pool Benchmarks

**Deliverables:**
- `bench/pool.ts` — tinybench 6.0.0 benchmark suite
  - `observe()` throughput (ops/sec)
  - `unobserve()` throughput
  - rAF scheduler flush latency under 100-element load
  - Memory allocation rate per operation
- `npm run bench` script
- Baseline results committed to `bench/results/baseline.json`

**Quality gate:** Pool `observe()` throughput > 1,000,000 ops/sec. Flush latency < 0.1ms for 100 elements.

---

#### `0.1.6` — Pool API Finalization

**Deliverables:**
- All public pool API annotated with `@internal` JSDoc (not exported from main entry)
- `src/pool.ts` type-checks cleanly with `isolatedDeclarations`
- TypeDoc generates correct internal API docs (not shown in public API reference)

**Quality gate:** `tsc --noEmit` and `tsgo --noEmit` both pass.

---

#### `0.1.7` — Browser Integration Tests for Pool

**Deliverables:**
- `tests/browser/pool.test.ts` running in Chromium, Firefox, WebKit via Vitest 4.1 + `@vitest/browser-playwright`
- Tests verify real browser `ResizeObserver` behavior:
  - `borderBoxSize` vs `contentBoxSize` values match spec
  - `devicePixelContentBoxSize` values scale with `window.devicePixelRatio`
  - Cross-browser DPR normalization

**Quality gate:** All browser tests pass in Chromium, Firefox, and WebKit.

---

#### `0.1.8` — Pool Documentation

**Deliverables:**
- `docs/guide/architecture.md` — pool architecture explanation with Mermaid diagram
- Mermaid diagram embedded in VitePress (Mermaid plugin configured)
- Architecture diagram as SVGO 4-optimized SVG (both formats available)

**Quality gate:** `npm run docs:build` exits `0` with Mermaid rendered.

---

#### `0.1.9` — Epoch 0.1 Hardening

**Deliverables:**
- 100% branch coverage on `src/pool.ts` and `src/scheduler.ts`
- All edge cases handled: null target, detached shadow root, document.hidden during resize
- `npm run size` re-verified (pool is internal; main entry must still be < 300B after this is bundled)
- Full changeset entry documenting `0.1.x` epoch

**Quality gate:** Coverage 100%. Size limit passes.

---

### EPOCH 0.2.x — Primary Hook

**Theme:** Build and harden the `useResizeObserver` hook — the primary public API surface.

---

#### `0.2.0` — `useResizeObserver` Hook — Core Implementation

**Deliverables:**
- `src/index.ts` — `useResizeObserver` hook
  - `'use client'` directive at file top
  - `useRef` internal ref creation
  - `useEffectEvent` for stable `onResize` callback identity
  - `useState` for `width`, `height`, `entry` (undefined until first observation)
  - `useEffect` for observation lifecycle tied to `ref.current`
  - Full integration with `ObserverPool`

**Quality gate:** Basic usage renders correct dimensions in browser tests.

---

#### `0.2.1` — Box Model Options

**Deliverables:**
- `box?: 'content-box' | 'border-box' | 'device-pixel-content-box'` option
- Default: `'content-box'`
- All three box models tested in Chromium, Firefox, WebKit
- `undefined` returned for `devicePixelContentBoxSize` in browsers that don't support it (graceful fallback to `contentBoxSize`)

**Quality gate:** Box model values match browser DevTools measurements (within Float16 precision).

---

#### `0.2.2` — External Ref Support

**Deliverables:**
- `ref?: RefObject<T | null>` option accepting user-provided ref
- When `ref` is provided, library uses it; when not, creates internal ref
- Return value always includes `ref` (user can attach to their element)
- TypeScript generic `T extends Element` propagated correctly through all signatures

**Quality gate:** TypeScript infers correct element type when `ref` is provided. No `any` escape hatches.

---

#### `0.2.3` — Shadow DOM & Custom Root Support

**Deliverables:**
- `root?: Document | ShadowRoot` option
- When `root` is a `ShadowRoot`, pool is scoped to that root
- Web Component integration test (custom element with shadow root)

**Quality gate:** Two components in different shadow roots observe independently without cross-contamination.

---

#### `0.2.4` — React Server Component Safety

**Deliverables:**
- `src/server.ts` — RSC-safe utilities
  - `createServerResizeObserverMock()` returning `{ width: undefined, height: undefined, entry: undefined }`
- `exports[\"./server\"]` entry in `package.json`
- Test: importing `use-resize-observer` in a simulated RSC environment produces a clear `'use client' boundary violated` error (not a cryptic hook error)
- `docs/guide/ssr.md` with full SSR/RSC guide

**Quality gate:** SSR test passes. RSC boundary is correctly enforced.

---

#### `0.2.5` — React Compiler Compatibility Audit

**Deliverables:**
- Install `babel-plugin-react-compiler` in test environment
- Run all hook tests under React Compiler transformation
- Verify `useEffectEvent` is correctly exempted from memoization analysis
- Verify no "invalid hook call" warnings under compiler
- Document compiler compatibility in `docs/guide/compiler.md`

**Quality gate:** All tests pass under React Compiler transformation. No memoization violations.

---

#### `0.2.6` — Hook Type Exports

**Deliverables:**
- `UseResizeObserverOptions<T>` — exported type
- `UseResizeObserverResult<T>` — exported type
- `ResizeObserverBoxOptions` — exported type alias
- All types `isolatedDeclarations`-clean (no inferred public types)
- TypeDoc generates correct API reference for all exported types

**Quality gate:** `tsc --noEmit` and `tsgo --noEmit` pass. TypeDoc HTML is accurate.

---

#### `0.2.7` — Hook Unit Tests — 100% Coverage

**Deliverables:**
- `tests/unit/hook.test.ts` — complete unit test suite using `renderHook` + happy-dom 20.8.3
  - Initial state: `{ width: undefined, height: undefined, entry: undefined }`
  - After observation: correct width/height from mock `ResizeObserver`
  - Box model switching: re-observes with new options
  - `onResize` callback: called with correct entry
  - Cleanup: unobserve called on unmount
  - Ref changes: re-observes when ref changes

**Quality gate:** 100% branch coverage on `src/index.ts`.

---

#### `0.2.8` — Hook Browser Tests — Cross-Browser

**Deliverables:**
- `tests/browser/hook.test.tsx` — browser integration tests in Chromium/Firefox/WebKit
  - Live DOM resize via `element.style.width = '200px'`
  - `act()` + `await` for async update propagation
  - `toBeInViewport` assertion (Playwright 1.59 alpha)
  - Screenshot regression test (`toMatchScreenshot`)

**Quality gate:** All browser tests pass in all three engines.

---

#### `0.2.9` — Main Entry Bundle Size Verification

**Deliverables:**
- `npm run size` verifies main entry is **< 300 bytes min+gzip**
- If over budget: dead code elimination audit, ensure no accidental React internals bundled
- Bundle analysis via tsdown's built-in `--report` flag
- `docs/guide/bundle-size.md` explaining the size budget and tree-shaking guarantees

**Quality gate:** `size-limit 12.0.0` passes with < 300B on main entry.

---

### EPOCH 0.3.x — Worker Threading

**Theme:** Build the off-main-thread `useResizeObserverWorker` hook using SharedArrayBuffer + Atomics.

---

#### `0.3.0` — Worker Protocol Types

**Deliverables:**
- `src/worker/protocol.ts` — complete message protocol with `Float16Array` SAB layout
- All message types discriminated unions
- `Promise.withResolvers()` for async handshake patterns

**Quality gate:** Protocol types are `isolatedDeclarations`-clean.

---

#### `0.3.1` — Worker Script

**Deliverables:**
- `src/worker/worker.ts` — Worker thread script
  - `ResizeObserver` instance inside Worker
  - SAB write via `Float16Array` + `Atomics.notify()`
  - `import.meta.resolve()` for self-referencing worker URL
  - Top-level `await` for async initialization

**Quality gate:** Worker script loads without errors in `new Worker(url, { type: 'module' })`.

---

#### `0.3.2` — `useResizeObserverWorker` Hook

**Deliverables:**
- `src/worker/hook.ts` — `useResizeObserverWorker` hook
  - `Atomics.waitAsync()` on main thread (non-blocking)
  - `rAF` loop for committing SAB reads to React state
  - Worker lifecycle tied to React component lifecycle
  - Clear error if `crossOriginIsolated` is `false`

**Quality gate:** Worker hook produces measurements within 1 rAF of main-thread hook.

---

#### `0.3.3` — Worker Pooling

**Deliverables:**
- Single Worker instance shared across all `useResizeObserverWorker` hooks in the application
- Worker is lazy-initialized on first use, kept alive until last observer unmounts
- SAB slot allocation: `Int32Array` bitmap for slot management

**Quality gate:** 100 components using `useResizeObserverWorker` spawn exactly 1 Worker.

---

#### `0.3.4` — Worker Browser Tests

**Deliverables:**
- `tests/browser/worker.test.tsx` — requires `crossOriginIsolated: true` headers
- Playwright `1.59.0-alpha` context with COOP/COEP headers configured
- Verifies Worker measurements match main-thread measurements (within Float16 precision)

**Quality gate:** Worker tests pass in Chromium (WebKit/Firefox: skip if SharedArrayBuffer unavailable).

---

#### `0.3.5` — Worker Entry Bundle

**Deliverables:**
- `dist/worker.js` produced by tsdown
- `exports["./worker"]` resolves correctly
- Worker entry bundle size < 1 KB gzip

**Quality gate:** `npm run size` passes. `dist/worker.js` loads correctly.

---

#### `0.3.6` — Worker Documentation

**Deliverables:**
- `docs/guide/worker.md` — complete Worker mode guide
  - COOP/COEP header configuration examples (Express, Nginx, Vercel, Cloudflare Workers)
  - When to use Worker mode vs main-thread mode (decision flowchart)
  - Mermaid diagram of the Worker protocol
  - Performance comparison: Worker vs main-thread (bench results embedded)

**Quality gate:** Docs build passes.

---

#### `0.3.7` — Worker Error Handling

**Deliverables:**
- Worker crash recovery: automatic Worker restart after unhandled error
- `Error.isError()` (ES2026) for discriminating error types in message handler
- Descriptive error messages for all failure modes

**Quality gate:** Worker crash → recovery → measurement resumes within 2 rAF cycles.

---

#### `0.3.8` — Worker Benchmarks

**Deliverables:**
- `bench/worker.ts` — Worker vs main-thread throughput comparison
- Results show Worker mode is beneficial when > N simultaneously resizing elements (N determined empirically)

**Quality gate:** Benchmark completes without error. Results committed to `bench/results/worker.json`.

---

#### `0.3.9` — Worker Epoch Hardening

**Deliverables:**
- Worker entry 100% branch coverage
- Worker mode disabled gracefully in environments without `Worker` (SSR, Node)
- Changeset entry for `0.3.x` epoch

**Quality gate:** `npm run test -- --coverage` passes 100%.

---

### EPOCH 0.4.x — Optional Shim & Server Exports

---

#### `0.4.0` — Polyfill Shim Entry

**Deliverables:**
- `src/shim.ts` — lazy-loading `ResizeObserver` shim for environments without native support
- Dynamic `import()` for the shim code — zero cost if never imported
- `dist/shim.js` < 1.5 KB gzip

**Quality gate:** `exports["./shim"]` resolves. Shim import installs `globalThis.ResizeObserver`.

---

#### `0.4.1` — `createResizeObserver` Factory

**Deliverables:**
- `createResizeObserver(options?)` — factory function for use outside React (vanilla JS)
- Returns `{ observe(el, cb), unobserve(el, cb), disconnect() }`
- Uses the same pool and scheduler as the hook
- Exported from main entry

**Quality gate:** Factory works in non-React environments. TypeScript types are correct.

---

#### `0.4.2` — `ResizeObserverContext` — DI for Testing & SSR

**Deliverables:**
- `ResizeObserverContext` — React context for injecting mock `ResizeObserver` implementations
- Used in tests to replace the real browser API
- Used in SSR to provide no-op implementation

**Quality gate:** Tests using `ResizeObserverContext` mock produce predictable results without a real browser.

---

#### `0.4.3` — WASM Optional Rounding

**Deliverables:**
- `src/shim/wasm-round.ts` — optional WASM module for `devicePixelContentBoxSize` normalization
- Built from AssemblyScript source in `wasm/`
- Loaded via dynamic `import()` only when `devicePixelContentBoxSize` is requested
- `Math.sumPrecise()` (ES2026) used as JS fallback when WASM is not available

**Quality gate:** WASM module loads and produces identical results to JS fallback.

---

#### `0.4.4` — `0.4.x` Hardening & Documentation

**Deliverables:**
- `docs/guide/advanced.md` covering factory API, context, WASM shim
- All shim/server/factory exports 100% tested
- Changeset entry

**Quality gate:** Full test suite passes. Docs build passes.

---

### EPOCH 0.5.x — Documentation System

**Theme:** Build the complete documentation site to a production-quality standard.

---

#### `0.5.0` — VitePress 2 Alpha Theme

**Deliverables:**
- `docs/.vitepress/theme/index.ts` — VitePress 2 theme definition using `defineTheme()`
- `docs/.vitepress/theme/tokens.css` — complete OKLCH color token system
- `docs/.vitepress/theme/fonts.css` — Geist + Geist Mono variable font setup
- Dark/light mode with OKLCH interpolation
- CSS `@property` definitions for animated custom properties

**OKLCH Color Token System:**
```css
/* docs/.vitepress/theme/tokens.css */

@property --crimson-hue {
  syntax: '<number>';
  inherits: true;
  initial-value: 11;
}

:root {
  /* Primary — Crimson brand */
  --c-primary:         oklch(52% 0.26 var(--crimson-hue));
  --c-primary-soft:    oklch(52% 0.26 var(--crimson-hue) / 0.12);
  --c-primary-hover:   oklch(58% 0.26 var(--crimson-hue));

  /* Violet accent */
  --c-accent:          oklch(58% 0.22 280);
  --c-accent-soft:     oklch(58% 0.22 280 / 0.10);

  /* Surface — dark mode default */
  --c-bg:              oklch(13% 0.02 var(--crimson-hue));
  --c-bg-soft:         oklch(17% 0.02 var(--crimson-hue));
  --c-bg-mute:         oklch(20% 0.02 var(--crimson-hue));

  /* Text */
  --c-text-1:          oklch(94% 0.01 var(--crimson-hue));
  --c-text-2:          oklch(72% 0.02 var(--crimson-hue));
  --c-text-3:          oklch(55% 0.02 var(--crimson-hue));

  /* Code blocks */
  --c-code-bg:         oklch(16% 0.025 var(--crimson-hue));

  /* Mesh gradient stops */
  --g-stop-1:          oklch(38% 0.28 var(--crimson-hue));
  --g-stop-2:          oklch(42% 0.22 280);
  --g-stop-3:          oklch(48% 0.18 220);
}

@media (prefers-color-scheme: light) {
  :root {
    --c-bg:       oklch(98% 0.005 var(--crimson-hue));
    --c-bg-soft:  oklch(95% 0.007 var(--crimson-hue));
    --c-text-1:   oklch(18% 0.02 var(--crimson-hue));
    --c-text-2:   oklch(38% 0.02 var(--crimson-hue));
    --c-code-bg:  oklch(93% 0.008 var(--crimson-hue));
  }
}

/* Animated hero mesh gradient — GPU-composited */
@keyframes mesh-drift {
  0%   { --crimson-hue: 11;  }
  33%  { --crimson-hue: 320; }
  66%  { --crimson-hue: 200; }
  100% { --crimson-hue: 11;  }
}

.hero-gradient {
  background: radial-gradient(
    ellipse 80% 60% at 20% 40%,
    var(--g-stop-1) 0%,
    transparent 60%
  ),
  radial-gradient(
    ellipse 60% 80% at 80% 60%,
    var(--g-stop-2) 0%,
    transparent 60%
  ),
  radial-gradient(
    ellipse 70% 50% at 50% 20%,
    var(--g-stop-3) 0%,
    transparent 60%
  );
  animation: mesh-drift 12s ease-in-out infinite;
  will-change: background;
}
```

**Quality gate:** VitePress 2 dev server renders theme without errors in Chromium.

---

#### `0.5.1` — Getting Started Guide

**Deliverables:**
- `docs/guide/getting-started.md` — complete installation + first-use guide
- Shiki 4 code blocks with `github-dark-dimmed` / `github-light` themes
- Step-by-step from install to first render with annotated code examples
- Comparison table: v9 (upstream) vs v10 (`@crimson_dev`) feature comparison

**Quality gate:** Docs build passes. All code blocks syntax-highlighted correctly.

---

#### `0.5.2` — API Reference (TypeDoc 0.28.17)

**Deliverables:**
- `typedoc.json` configuration
- TypeDoc generates Markdown via `typedoc-plugin-markdown@4.10.0`
- Sidebar auto-generated via `typedoc-vitepress-theme@1.1.2`
- All public exports documented with examples
- Internal (`@internal`) symbols excluded from public docs

**typedoc.json:**
```json
{
  "entryPoints": ["src/index.ts", "src/worker.ts", "src/shim.ts", "src/server.ts"],
  "entryPointStrategy": "resolve",
  "plugin":    ["typedoc-plugin-markdown", "typedoc-vitepress-theme"],
  "out":        "docs/api",
  "theme":      "vitepress",
  "readme":     "none",
  "excludePrivate":  true,
  "excludeInternal": true,
  "includeVersion":  true,
  "searchInComments": true,
  "groupOrder":  ["Functions", "Types", "Interfaces", "Variables"],
  "parametersFormat": "table",
  "propertiesFormat": "table",
  "enumMembersFormat": "table"
}
```

**Quality gate:** TypeDoc generates valid Markdown. VitePress renders API docs without errors.

---

#### `0.5.3` — Migration Guide

**Deliverables:**
- `docs/guide/migration.md` — complete migration from `use-resize-observer@9.1.0`
- Zero-change migration path documented
- Breaking changes table (React 19 requirement, CJS removal, polyfill manual opt-in)
- Side-by-side code diffs

**Quality gate:** Docs build passes.

---

#### `0.5.4` — Examples Gallery

**Deliverables:**
- `docs/guide/examples.md` — 10+ real-world usage examples
  - Basic width/height tracking
  - Responsive typography
  - Virtual list row height measurement
  - Chart canvas resize
  - Shadow DOM component
  - Worker mode for animation-intensive UI
  - SSR with `ResizeObserverContext` mock
  - `createResizeObserver` in vanilla JS
  - React Compiler with `useResizeObserver`
  - Integration with `@preact/signals-react`

**Quality gate:** All examples are copy-paste runnable (verified in sandbox environment).

---

#### `0.5.5` — Live Demo Visualizer

**Deliverables:**
- `docs/demos/visualizer/` — React 19 live resize visualizer component (client-side island)
- Shows real-time `contentBoxSize`, `borderBoxSize`, `devicePixelContentBoxSize` values
- D3-powered bar chart updating at 60fps
- OffscreenCanvas heatmap rendered in a Worker (transferred via `transferFromImageBitmap`)
- Toggle between main-thread and Worker mode with live FPS counter
- CSS Houdini `CSS.paintWorklet` for the mesh gradient background (compositor thread)
- View Transitions API for panel state changes

**Quality gate:** Visualizer renders in Chromium without layout shifts. Lighthouse performance score > 95.

---

#### `0.5.6` — README Design

**Deliverables:**
- `README.md` — production-quality document
  - Badge row: npm version, bundle size, CI status, coverage, license
  - Hero ASCII art with `@crimson_dev/use-resize-observer` branding
  - Minimal install + usage block in first 20 lines
  - Feature table (zero deps, ESM-only, Worker-native, < 300B, React 19)
  - Comparison with upstream `use-resize-observer@9.1.0`
  - Architecture Mermaid diagram
  - Link to full docs site

**Quality gate:** README renders correctly on npm package page and GitHub.

---

#### `0.5.7` — GitHub Wiki

**Deliverables:**
- GitHub Wiki initialized and linked from README
- `Home.md` — overview and navigation
- `Architecture.md` — deep pool/scheduler/worker architecture
- `React-Compiler-Compatibility.md`
- `ResizeObserver-Spec-Notes.md` — cross-browser quirks documented
- `Performance-Benchmarks.md` — historical tinybench 6 results
- `Security-Policy.md`
- `Contributing.md` — dev setup, testing, PR checklist
- All wiki pages use OKLCH-aware HTML `<details>` blocks for collapsible sections

**Quality gate:** All wiki pages render correctly on GitHub.

---

#### `0.5.8` — Animated SVG Diagrams

**Deliverables:**
- `docs/public/diagrams/pool-architecture.svg` — animated SVG of the shared pool architecture
- `docs/public/diagrams/scheduling.svg` — animated SVG of the rAF scheduling pipeline
- `docs/public/diagrams/worker-protocol.svg` — animated SVG of the Worker message protocol
- All SVGs optimized via SVGO 4.0.1 (ESM plugin API)
- CSS animations only (no JS in SVGs); `prefers-reduced-motion` respected

**SVGO 4 optimization script:**
```typescript
// scripts/optimize-svgs.ts
import { optimize } from 'svgo';
import { readdir, readFile, writeFile } from 'node:fs/promises';

const SVG_DIR = 'docs/public/diagrams';

const files = await readdir(SVG_DIR);
await Promise.all(
  files
    .filter(f => f.endsWith('.svg'))
    .map(async (file) => {
      const input  = await readFile(`${SVG_DIR}/${file}`, 'utf8');
      const result = optimize(input, {
        plugins: [
          'preset-default',
          'removeDimensions',
          { name: 'removeAttrs', params: { attrs: ['data-name'] } },
        ],
        multipass: true,
      });
      await writeFile(`${SVG_DIR}/${file}`, result.data);
    }),
);
```

**Quality gate:** SVGs are < 10 KB each after SVGO 4 optimization. Animations play correctly.

---

#### `0.5.9` — Documentation Epoch Hardening

**Deliverables:**
- `docs:build` produces zero warnings
- All internal links verified (VitePress dead link check enabled)
- Lighthouse accessibility score > 98 on docs site
- `docs/` directory has no `.DS_Store`, no uncommitted generated files
- `docs/.vitepress/cache/` added to `.gitignore`

**Quality gate:** VitePress build exits `0` with `--failOnDeadLinks`.

---

### EPOCH 0.6.x — Performance Hardening

**Theme:** Benchmark, profile, and optimize every layer until each metric target is met.

---

#### `0.6.0` — Benchmark Suite Completion

**Deliverables:**
- `bench/pool.ts` — pool ops/sec (established in 0.1.5, extended here)
- `bench/hook.ts` — hook render throughput under continuous resize events
- `bench/worker.ts` — Worker mode measurement latency vs main-thread
- `bench/memory.ts` — heap growth over 10k observe/unobserve cycles
- `bench/scheduler.ts` — rAF flush throughput with 100/500/1000 elements
- All benchmarks using tinybench 6.0.0 Worker-isolated mode + `Temporal` timestamps

**Quality gate:** All benchmarks complete without error. Results in `bench/results/`.

---

#### `0.6.1` — Bundle Analysis & Dead Code Elimination

**Deliverables:**
- `npm run build -- --report` generates bundle analysis
- Verify tree-shaking: importing only `useResizeObserver` excludes all Worker/Shim code
- Sub-path exports (`./worker`, `./shim`) independently tree-shakeable
- `sideEffects: false` verified effective (no side effects executed at import time)

**Quality gate:** `size-limit 12.0.0` passes. Worker code is absent from `dist/index.js`.

---

#### `0.6.2` — V8 Optimization Audit

**Deliverables:**
- Profile `ObserverPool` with `--prof` in Node 25
- Verify hot paths are monomorphic (no megamorphic ICs)
- Verify no deoptimizations in `#flush()` or `observe()`
- `Float16Array` usage verified as optimized path in V8 13

**Quality gate:** V8 profile shows no deopt events in hot paths during 10k resize cycles.

---

#### `0.6.3` — Concurrency Stress Test

**Deliverables:**
- Stress test: 1000 elements observed simultaneously, all resize in same rAF
- Verify exactly 1 React `setState` batch per rAF (not 1000)
- Stress test: rapid observe/unobserve cycling (100 ops/ms)
- Verify no race conditions under rapid cycling

**Quality gate:** Stress test passes without errors. React DevTools shows 1 render per rAF flush.

---

#### `0.6.4` — Memory Pressure Tests

**Deliverables:**
- `bench/memory.ts` extended with heap snapshot comparison
- 10,000 observe/unobserve cycles → heap delta < 1 MB
- `FinalizationRegistry` verified collecting detached element callbacks
- Worker `SharedArrayBuffer` slot recycling verified (no slot leaks)

**Quality gate:** Heap delta < 1 MB over 10k cycle test.

---

#### `0.6.5` — CI Performance Regression Guard

**Deliverables:**
- `.github/workflows/bench.yml` — CI benchmark job
  - Runs on every PR targeting `main`
  - Compares results to `bench/results/baseline.json`
  - Posts performance report as PR comment
  - Fails if any metric degrades > 10% from baseline

**Quality gate:** Benchmark CI job completes in < 2 minutes.

---

#### `0.6.6` — `0.6.x` Hardening

**Deliverables:**
- All benchmark results updated in `bench/results/`
- Perf guide added to docs: `docs/guide/performance.md`
- All size-limit gates re-verified after any source changes

**Quality gate:** Full CI pipeline passes.

---

### EPOCH 0.7.x — Advanced API & Integrations

---

#### `0.7.0` — `useResizeObserverEntries` — Multi-Element Variant

**Deliverables:**
- `useResizeObserverEntries(refs: RefObject<Element | null>[])` — observes multiple elements simultaneously
- Returns `Map<Element, { width, height, entry }>` keyed by element
- Single pool subscription for all elements (not N subscriptions)
- Exported from main entry

**Quality gate:** N elements with 1 hook call produce N entries in the returned Map.

---

#### `0.7.1` — Reactive Integration Reference

**Deliverables:**
- `docs/guide/signals.md` — integration guide for `@preact/signals-react`
- Reference implementation (not bundled): `useResizeObserver` → `signal` pattern
- Reference implementation: `useResizeObserver` → `@reactively/core` cell pattern
- Both patterns verified with React Compiler

**Quality gate:** Reference implementations are copy-paste runnable.

---

#### `0.7.2` — `useResizeObserverWorker` — Full Feature Parity

**Deliverables:**
- Worker hook supports all box models (`content-box`, `border-box`, `device-pixel-content-box`)
- Worker hook supports external `ref` option
- Worker hook supports `onResize` callback
- Worker hook API is a drop-in replacement for main-thread hook

**Quality gate:** Worker hook passes same test suite as main-thread hook.

---

#### `0.7.3` — Framework-Agnostic Core Export

**Deliverables:**
- `src/core.ts` — pure framework-agnostic observable using `EventTarget`
- `exports["./core"]` subpath
- Enables `use-resize-observer` without React (Solid, Vue, Svelte, vanilla)
- Framework adapter pattern documented

**Quality gate:** Core exports work in a Solid.js `createSignal` wrapper without React.

---

#### `0.7.4` — Accessibility — Reduced Motion

**Deliverables:**
- Demo visualizer respects `prefers-reduced-motion` — pauses mesh gradient animation, disables bar chart transitions
- All animated SVG diagrams respect `prefers-reduced-motion` via `@media (prefers-reduced-motion: reduce)`
- Visualizer screen-reader accessible (ARIA live regions for dimension values)

**Quality gate:** Lighthouse accessibility score > 98.

---

#### `0.7.5` — `0.7.x` Hardening

**Deliverables:**
- All new APIs 100% tested
- API surface documented in TypeDoc
- Changeset entry for `0.7.x` epoch

**Quality gate:** Full suite passes. Size limits pass.

---

### EPOCH 0.8.x — Release Engineering

---

#### `0.8.0` — Provenance & Security

**Deliverables:**
- npm provenance enabled (`--provenance` flag in publish script)
- `SECURITY.md` with responsible disclosure policy
- `package.json` `"funding"` field
- All dependencies audited: `npm audit --omit=dev` exits `0`
- `socket.dev` integration in CI (supply chain security scanning)

**Quality gate:** `npm audit` exits `0`. Provenance attestation generated on publish.

---

#### `0.8.1` — Full CI Matrix Hardening

**Deliverables:**
- CI matrix expanded: Node 25 (stable), Node 25-nightly
- Cross-platform: `ubuntu-latest`, `windows-latest`, `macos-latest`
- TS 6 stable + TS 7 native preview both required to pass
- Playwright multi-browser: Chromium, Firefox, WebKit on all platforms

**Quality gate:** All 12 matrix combinations (3 OS × 2 Node × 2 TS) pass.

---

#### `0.8.2` — npm Publishing Flow

**Deliverables:**
- `@crimson_dev` npm organization created
- `npm publish --access public` verified
- `@crimson_dev/use-resize-observer@0.8.2` published to npm as first public beta
- `npm pack --dry-run` verified correct file inclusions
- `publint` passes on published tarball

**Quality gate:** `npm install @crimson_dev/use-resize-observer` in a fresh project exits `0` and the hook works.

---

#### `0.8.3` — Docs Deployment

**Deliverables:**
- GitHub Pages deployment via `docs.yml` workflow
- Custom domain `use-resize-observer.crimsondev.io` (placeholder)
- `sitemap.xml` generated
- `robots.txt` configured
- Google Lighthouse CI integrated: builds fail if Perf < 90, A11y < 95

**Quality gate:** Docs site deployed and accessible. Lighthouse CI passes.

---

#### `0.8.4` — `0.8.x` Hardening

**Deliverables:**
- Complete release checklist documented in `CONTRIBUTING.md`
- `npm run release` dry-run verified

**Quality gate:** Release pipeline passes end-to-end dry run.

---

### EPOCH 0.9.x — Pre-Release Hardening

**Theme:** No new features. Only hardening, polishing, and external validation.

---

#### `0.9.0` — Public Beta Announcement

**Deliverables:**
- `@crimson_dev/use-resize-observer@0.9.0` published as `beta` dist-tag
- Blog post draft in `docs/blog/0.9-beta.md`
- All package metadata correct (description, keywords, author, repository, homepage)
- `"dist-tags": { "beta": "0.9.0", "latest": "0.0.1" }` (latest not promoted until `1.0.0`)

**Quality gate:** `npm install @crimson_dev/use-resize-observer@beta` works in a CRA/Vite/Next project.

---

#### `0.9.1` — External Feedback Integration

**Deliverables:**
- Community beta feedback collected via GitHub Discussions
- All P0/P1 issues resolved
- Breaking API changes (if any) documented in migration guide

**Quality gate:** No open P0/P1 issues.

---

#### `0.9.2` — Performance Final Audit

**Deliverables:**
- All benchmark targets met (see §17)
- Bundle size final verification: main < 300B, worker < 1KB, shim < 1.5KB
- React DevTools profiler trace attached to `bench/results/react-profile.json`

**Quality gate:** All benchmark targets met.

---

#### `0.9.3` — Accessibility & Cross-Browser Final Audit

**Deliverables:**
- Playwright 1.59 alpha E2E suite passes on Chromium, Firefox, WebKit
- NVDA + JAWS screen reader manual testing on visualizer
- VoiceOver on macOS/iOS testing on docs site
- Color contrast verified in OKLCH (WCAG 2.2 Level AA minimum, AAA for body text)

**Quality gate:** Lighthouse accessibility > 98. Zero WCAG violations.

---

#### `0.9.4` → `0.9.9` — Final Polish Sprints

Each minor increment in this range is a polish sprint:

| Version | Focus |
|---------|-------|
| `0.9.4` | TypeDoc API completeness — all symbols have examples |
| `0.9.5` | README final pass — copy-editing, badge updates |
| `0.9.6` | CHANGELOG final pass — all changes documented |
| `0.9.7` | GitHub Wiki final pass — all pages proofread |
| `0.9.8` | Demo visualizer performance — 60fps on mid-range hardware verified |
| `0.9.9` | Release candidate — final `npm pack` verification |

---

### MILESTONE `1.0.0` — Stable Release

**Criteria for promotion from `0.9.9` to `1.0.0`:**

- [ ] All 12 CI matrix combinations passing
- [ ] 100% test coverage on all source files
- [ ] All bundle size limits passing (main < 300B, worker < 1KB, shim < 1.5KB)
- [ ] All benchmark targets met (§17)
- [ ] Zero open P0/P1 issues
- [ ] TypeDoc API reference complete and accurate
- [ ] VitePress docs site deployed and accessible
- [ ] GitHub Wiki complete
- [ ] CHANGELOG accurate and complete
- [ ] npm provenance enabled
- [ ] Public beta (`0.9.x`) has been available for at least 30 days
- [ ] At least one real-world project validated

**Release actions:**

```bash
npm run build
npm run test
npm run size
npx changeset version    # bumps to 1.0.0
npx changeset publish    # publishes with provenance
# Promote dist-tag:
npm dist-tag add @crimson_dev/use-resize-observer@1.0.0 latest
```

---

## 7. TypeScript 6 + TS7 Native Preview Configuration

### `tsconfig.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target":                        "ESNext",
    "lib":                           ["ESNext", "DOM", "DOM.Iterable", "WebWorker"],
    "module":                        "NodeNext",
    "moduleResolution":              "NodeNext",
    "strict":                        true,
    "exactOptionalPropertyTypes":    true,
    "noUncheckedIndexedAccess":      true,
    "noImplicitOverride":            true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns":             true,
    "allowUnreachableCode":          false,
    "allowUnusedLabels":             false,
    "isolatedDeclarations":          true,
    "isolatedModules":               true,
    "verbatimModuleSyntax":          true,
    "erasableSyntaxOnly":            true,
    "skipLibCheck":                  false,
    "declaration":                   true,
    "declarationMap":                true,
    "sourceMap":                     true,
    "outDir":                        "./dist",
    "rootDir":                       "./src",
    "useDefineForClassFields":       true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests", "bench", "docs", "wasm"]
}
```

**Note on `"erasableSyntaxOnly": true`:** This TS 6 option ensures all TypeScript-specific syntax is erasable by Node 25's native type stripper (no `enum`, no `namespace`, no parameter properties). This makes the source files runnable directly in Node 25 with `--experimental-strip-types` without a compile step.

**Note on `"target": "ESNext"`:** The string `"ESNext"` is preferred over `"ES2026"` because it always maps to the absolute latest ES version in the installed TypeScript version. Since we pin TS to `6.0.0-dev.20260305`, and that build's ESNext includes all ES2026 features, this is equivalent to `"ES2026"` but is more future-safe — it doesn't need to be updated when ES2027 is finalized.

---

## 8. Build System — tsdown 0.21.0-beta.5

### `tsdown.config.ts`

```typescript
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index:  'src/index.ts',
    worker: 'src/worker.ts',
    shim:   'src/shim.ts',
    server: 'src/server.ts',
    core:   'src/core.ts',
  },
  format:    ['esm'],
  outDir:    'dist',
  clean:     true,
  dts:       true,            // Parallel DTS via isolatedDeclarations
  sourcemap: true,
  minify:    process.env['NODE_ENV'] === 'production',
  treeshake: true,
  target:    'esnext',
  platform:  'browser',
  external:  ['react', 'react-dom'],
  define: {
    'import.meta.env.VERSION': JSON.stringify(process.env['npm_package_version'] ?? '0.0.0'),
  },
  banner: {
    js: `'use client';`,
  },
  // tsdown 0.21 beta: enable Rolldown 2.x chunking
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  // Report bundle size after each build
  report: true,
});
```

### Build Performance

With tsdown 0.21.0-beta.5 + Rolldown 2.x on Node 25:
- Full build (5 entries + DTS): **< 10ms**
- Watch mode HMR per change: **< 2ms**
- DTS generation (parallel via `isolatedDeclarations`): **< 5ms**

---

## 9. Core API Architecture

### Public Export Surface

```typescript
// src/index.ts — 'use client' boundary

// Primary hook
export { useResizeObserver }    from './hook.js';
export { useResizeObserverEntries } from './hook-multi.js';
export { createResizeObserver } from './factory.js';
export { ResizeObserverContext } from './context.js';

// Types only (tree-shakeable)
export type { UseResizeObserverOptions }  from './hook.js';
export type { UseResizeObserverResult }   from './hook.js';
export type { ResizeObserverBoxOptions }  from './hook.js';
export type { ResizeObserverFactory }     from './factory.js';
```

### Hook Signature

```typescript
// src/hook.ts

export type ResizeObserverBoxOptions =
  | 'border-box'
  | 'content-box'
  | 'device-pixel-content-box';

export interface UseResizeObserverOptions<T extends Element = Element> {
  /** Pre-existing ref to observe. If omitted, an internal ref is created. */
  ref?: RefObject<T | null>;
  /** Which box model to report. @default 'content-box' */
  box?: ResizeObserverBoxOptions;
  /** Document or ShadowRoot scoping the pool. @default target.ownerDocument */
  root?: Document | ShadowRoot;
  /**
   * Called on every resize event. Identity is stable across renders
   * (powered by useEffectEvent) — do NOT wrap in useCallback.
   */
  onResize?: (entry: ResizeObserverEntry) => void;
}

export interface UseResizeObserverResult<T extends Element = Element> {
  /** Attach this ref to the element you want to observe. */
  ref: RefObject<T | null>;
  /** Inline size of the observed box. undefined until first observation. */
  width: number | undefined;
  /** Block size of the observed box. undefined until first observation. */
  height: number | undefined;
  /** The raw ResizeObserverEntry. undefined until first observation. */
  entry: ResizeObserverEntry | undefined;
}
```

---

## 10. Worker Threading Architecture

### Protocol State Machine

```
UNINITIALIZED
    │ first useResizeObserverWorker() call
    ▼
INITIALIZING
    │ Worker spawned, SAB allocated, handshake message sent
    ▼
READY
    │ Worker acknowledged with slot map
    ▼
OBSERVING  ←──────────────────────────────────────┐
    │ observe(element)                              │
    │  → post { op: 'observe', slotId, channel }   │
    │  → Atomics.waitAsync(sab, slotId)             │
    │  → rAF loop reads Float16Array                │
    │  → startTransition → setState                 │
    │                                               │
    │ unobserve(element)                            │
    │  → post { op: 'unobserve', slotId }           │
    └───────────────────────────────────────────────┘
    │ last observer unmounts
    ▼
TERMINATING
    │ Worker.terminate() called
    ▼
UNINITIALIZED
```

### SharedArrayBuffer Layout

```
Byte offset 0: Int32Array[0] — global version counter (Atomics.notify target)
Byte offset 4: Int32Array[1..256] — per-slot version counters
Byte offset 1028: Float16Array[0..1023] — 256 slots × 4 Float16 values
                   Each slot: [inlineSize, blockSize, borderInline, borderBlock]

Total SAB size: 4 + (256 × 4) + (256 × 4 × 2) = 3076 bytes ≈ 3 KB
```

---

## 11. Testing Architecture — Vitest 4.1 + Playwright Alpha

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import { playwright }   from '@vitest/browser-playwright';
import react            from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals:           true,
    detectLeaks:       true,    // Vitest 4.1: detect async leaks
    detectOpenHandles: true,
    projects: [
      // ── Tier 1: Fast unit tests (happy-dom 20.8.3) ──────────────────────
      {
        test: {
          name:        'unit',
          include:     ['tests/unit/**/*.test.ts'],
          environment: 'happy-dom',
          setupFiles:  ['tests/setup/unit.ts'],
        },
      },
      // ── Tier 2: Real browser tests (Playwright 1.59 alpha) ──────────────
      {
        test: {
          name:    'browser:chromium',
          include: ['tests/browser/**/*.test.tsx'],
          browser: {
            enabled:  true,
            headless: true,
            provider: playwright({
              launchOptions: { channel: 'chromium' },
              actionTimeout: 10_000,
            }),
            instances: [{ browser: 'chromium' }],
            trace:    'on-first-retry',   // Vitest 4.1 Playwright Trace
          },
        },
      },
      {
        test: {
          name:    'browser:firefox',
          include: ['tests/browser/**/*.test.tsx'],
          browser: {
            enabled:  true,
            headless: true,
            provider: playwright({ actionTimeout: 15_000 }),
            instances: [{ browser: 'firefox' }],
          },
        },
      },
      {
        test: {
          name:    'browser:webkit',
          include: ['tests/browser/**/*.test.tsx'],
          browser: {
            enabled:  true,
            headless: true,
            provider: playwright({ actionTimeout: 15_000 }),
            instances: [{ browser: 'webkit' }],
          },
        },
      },
    ],
    coverage: {
      provider:    'v8',
      include:     ['src/**/*.ts'],
      exclude:     ['src/**/*.d.ts', 'src/worker/worker.ts'],
      thresholds:  { lines: 100, functions: 100, branches: 100, statements: 100 },
      reporter:    ['text', 'lcov', 'html'],
    },
  },
});
```

### Playwright 1.59-alpha Features Used

- **`toBeInViewport({ ratio: 0.5 })`** — verify partial visibility of observed elements
- **`toMatchScreenshot()`** — cross-browser screenshot regression for the visualizer
- **`frameLocator()`** — testing the visualizer when embedded in an iframe
- **Playwright Trace** — `trace: 'on-first-retry'` captures network/DOM snapshots on failure
- **WASM interception** — intercept and stub the optional WASM shim module in tests

---

## 12. Documentation System — VitePress 2.0 Alpha + Shiki 4

### `docs/.vitepress/config.ts`

```typescript
import { defineConfig }   from 'vitepress';
import { withMermaid }    from 'vitepress-plugin-mermaid';
import { createHighlighter } from 'shiki/core';           // Shiki 4 tree-shakeable import
import { bundledLanguages }  from 'shiki/bundle/full';

// Pre-create highlighter (Shiki 4: synchronous after await)
const highlighter = await createHighlighter({
  themes: ['github-dark-dimmed', 'github-light'],
  langs:  [
    bundledLanguages.typescript,
    bundledLanguages.tsx,
    bundledLanguages.bash,
    bundledLanguages.json,
    bundledLanguages.yaml,
  ],
});

export default withMermaid(defineConfig({
  title:       '@crimson_dev/use-resize-observer',
  description: 'Zero-dependency, Worker-native React 19 ResizeObserver hook',
  lang:        'en-US',
  base:        '/use-resize-observer/',

  head: [
    ['meta', { name: 'theme-color', content: 'oklch(52% 0.26 11)' }],
    ['meta', { name: 'og:type',     content: 'website' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', {
      rel:  'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400..600&family=Spline+Sans:wght@400..700&display=swap',
    }],
  ],

  // VitePress 2: View Transitions API for navigation
  appearance:      'dark',
  lastUpdated:     true,
  cleanUrls:       true,
  metaChunk:       true,

  markdown: {
    // Shiki 4 integration (VitePress 2 native)
    shikiSetup: async (shiki) => {
      await shiki.loadTheme('github-dark-dimmed', 'github-light');
    },
    theme: {
      dark:  'github-dark-dimmed',
      light: 'github-light',
    },
    lineNumbers:    true,
    toc: { level: [2, 3] },
  },

  themeConfig: {
    logo:  { src: '/logo.svg', alt: '@crimson_dev' },
    siteTitle: 'use-resize-observer',

    nav: [
      { text: 'Guide',   link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API',     link: '/api/',                  activeMatch: '/api/' },
      { text: 'Demos',   link: '/demos/',                activeMatch: '/demos/' },
      { text: 'Blog',    link: '/blog/',                  activeMatch: '/blog/' },
      {
        text: '0.0.1',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'npm',       link: 'https://npmjs.com/package/@crimson_dev/use-resize-observer' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started',  link: '/guide/getting-started' },
            { text: 'Why This Library', link: '/guide/why' },
            { text: 'Migration',        link: '/guide/migration' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Architecture',     link: '/guide/architecture' },
            { text: 'Box Models',       link: '/guide/box-models' },
            { text: 'Bundle Size',      link: '/guide/bundle-size' },
            { text: 'Performance',      link: '/guide/performance' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Worker Mode',     link: '/guide/worker' },
            { text: 'SSR & RSC',       link: '/guide/ssr' },
            { text: 'React Compiler',  link: '/guide/compiler' },
            { text: 'Signals',         link: '/guide/signals' },
            { text: 'Advanced API',    link: '/guide/advanced' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Examples',        link: '/guide/examples' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/crimson-dev/use-resize-observer' },
      { icon: 'npm',    link: 'https://npmjs.com/package/@crimson_dev/use-resize-observer' },
    ],

    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: { fuzzy: 0.2, prefix: true, boost: { title: 4, text: 2 } },
        },
      },
    },

    editLink: {
      pattern: 'https://github.com/crimson-dev/use-resize-observer/edit/main/docs/:path',
      text:    'Edit this page on GitHub',
    },

    footer: {
      message:   'Released under the MIT License.',
      copyright: 'Copyright © 2026 Crimson Dev',
    },

    // VitePress 2: Carbon ads (optional; remove if unwanted)
    // carbonAds: { code: '...', placement: '...' },
  },

  mermaid: {
    securityLevel: 'loose',
    theme:         'dark',
  },

  // VitePress 2: View Transitions API
  // Enabled natively; each page navigation uses document.startViewTransition()
}));
```

---

## 13. GitHub Automation & CI/CD

### CI Workflow Matrix

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, 'release/*']
  pull_request:
    branches: [main]

concurrency:
  group:  ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Lint & Type-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '25', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck          # tsc --noEmit (TS 6)
      - run: npm run typecheck:ts7      # tsgo --noEmit (TS 7 native preview)
      - run: npm run build
      - run: npx publint                # Exports map validation

  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '25', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: npm run test -- --project unit --coverage
      - uses: codecov/codecov-action@v4

  test-browser:
    name: Browser Tests — ${{ matrix.browser }}
    runs-on: ubuntu-latest
    needs: quality
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '25', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - run: npm run test -- --project browser:${{ matrix.browser }}

  size:
    name: Bundle Size
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '25', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: npm run size
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}

  bench:
    name: Performance Benchmarks
    runs-on: ubuntu-latest
    needs: [test-unit, test-browser]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: '25', cache: 'npm' }
      - run: npm ci && npm run build
      - run: npm run bench -- --json > bench/results/pr.json
      - name: Compare with baseline
        run: node scripts/bench-compare.mjs
      - uses: actions/github-script@v7
        with:
          script: |
            const report = require('./bench/results/comparison.json');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report.markdown,
            });

  release:
    name: Release
    runs-on: ubuntu-latest
    needs: [test-unit, test-browser, size]
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: write
      id-token: write    # Required for npm provenance
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with:
          node-version: '25'
          cache:         'npm'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci && npm run build
      - run: npx changeset publish --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN:    ${{ secrets.GITHUB_TOKEN }}
```

---

## 14. Aesthetics System — OKLCH · Mesh Gradients · View Transitions

### Design Principles

1. **OKLCH color space throughout** — never `#hex`, never `rgb()`, never `hsl()` in any authored CSS. OKLCH provides perceptual uniformity: equal lightness values look equally bright across all hues, enabling accessible color systems that are mathematically predictable.

2. **Variable fonts for all typography** — Geist (body + UI), Geist Mono (code), Spline Sans (headings). Variable fonts reduce HTTP requests, enable smooth weight animations, and render better at all sizes.

3. **CSS-only animations** — all animations use `@keyframes` + `animation`, `transition`, or `CSS.paintWorklet`. Zero JS animation loops. Every animation respects `prefers-reduced-motion: reduce`.

4. **GPU-composited properties only** — animated properties are limited to `transform`, `opacity`, and custom properties with `@property` syntax registration (for GPU-composited custom property interpolation). No `width`, `height`, `color`, `background-color` animation.

5. **View Transitions API** — page navigation uses `document.startViewTransition()` via VitePress 2's native support. Element-level transitions use `view-transition-name`.

6. **Houdini Paint Worklet** — the hero mesh gradient and code block decorations use `CSS.paintWorklet.addModule()` for compositor-thread rendering, completely bypassing the main thread for visual effects.

7. **`content-visibility: auto`** for long API reference pages — reduces initial render time for TypeDoc-generated pages with hundreds of function signatures.

### Typography Scale

```css
/* docs/.vitepress/theme/typography.css */

:root {
  --font-body:     'Geist',       system-ui, sans-serif;
  --font-mono:     'Geist Mono',  'Cascadia Code', monospace;
  --font-heading:  'Spline Sans', 'Geist', sans-serif;

  /* Fluid type scale via clamp() — no media query breakpoints needed */
  --text-xs:   clamp(0.694rem,  0.6vw  + 0.5rem, 0.800rem);
  --text-sm:   clamp(0.833rem,  0.8vw  + 0.6rem, 0.938rem);
  --text-base: clamp(1.000rem,  1.0vw  + 0.75rem, 1.125rem);
  --text-lg:   clamp(1.200rem,  1.2vw  + 0.9rem, 1.375rem);
  --text-xl:   clamp(1.440rem,  1.5vw  + 1.0rem, 1.688rem);
  --text-2xl:  clamp(1.728rem,  2.0vw  + 1.1rem, 2.063rem);
  --text-3xl:  clamp(2.074rem,  2.5vw  + 1.2rem, 2.563rem);
  --text-4xl:  clamp(2.488rem,  3.5vw  + 1.3rem, 3.125rem);

  /* Line heights */
  --leading-tight:  1.25;
  --leading-snug:   1.375;
  --leading-normal: 1.625;
  --leading-loose:  1.875;

  /* Letter spacing */
  --tracking-tight:  -0.025em;
  --tracking-normal:  0em;
  --tracking-wide:    0.025em;
  --tracking-wider:   0.05em;
}
```

### Markdown File Aesthetics

Every Markdown file produced in this project follows these rules:

**`README.md` structure:**
```
[Badges row — minimal, maximum 5 badges]
[Logo/ASCII art — centered, < 8 lines]
[One-line description — < 100 characters]
[Installation — code block, copy-paste ready]
[Minimal example — < 15 lines]
[Feature table — 5-7 rows maximum]
[Links: docs, changelog, contributing]
```

**Guide pages:** All Markdown guide pages use:
- `:::tip`, `:::warning`, `:::danger` VitePress containers for callouts
- Mermaid diagrams for architecture explanations (no static image alternatives — Mermaid renders in both dark and light mode automatically)
- Code blocks with `// [!code highlight]` and `// [!code focus]` VitePress annotations
- All code examples have a matching test in `tests/`

**GitHub Wiki pages:** Use GitHub's native Markdown with `<details>` collapse blocks for long sections. Architecture diagrams use Mermaid (GitHub natively renders Mermaid in Markdown).

---

## 15. Repository File Structure

```
@crimson_dev/use-resize-observer/
├── .changeset/
│   └── config.json
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   ├── feature_request.yml
│   │   └── performance_regression.yml
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── docs.yml
│   │   └── bench.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS
│   └── SECURITY.md
├── bench/
│   ├── pool.ts
│   ├── hook.ts
│   ├── worker.ts
│   ├── memory.ts
│   ├── scheduler.ts
│   └── results/
│       ├── baseline.json
│       └── worker.json
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts
│   │   └── theme/
│   │       ├── index.ts
│   │       ├── tokens.css
│   │       ├── typography.css
│   │       ├── animations.css
│   │       └── components/
│   │           └── ResizeVisualizer.tsx
│   ├── api/           (TypeDoc generated — gitignored)
│   ├── blog/
│   │   └── 0.9-beta.md
│   ├── demos/
│   │   └── visualizer/
│   │       └── index.md
│   ├── guide/
│   │   ├── getting-started.md
│   │   ├── why.md
│   │   ├── architecture.md
│   │   ├── box-models.md
│   │   ├── bundle-size.md
│   │   ├── performance.md
│   │   ├── worker.md
│   │   ├── ssr.md
│   │   ├── compiler.md
│   │   ├── signals.md
│   │   ├── advanced.md
│   │   ├── examples.md
│   │   ├── migration.md
│   │   └── troubleshooting.md
│   ├── public/
│   │   ├── logo.svg           (SVGO 4 optimized)
│   │   ├── og-image.png
│   │   └── diagrams/
│   │       ├── pool-architecture.svg
│   │       ├── scheduling.svg
│   │       └── worker-protocol.svg
│   └── index.md
├── scripts/
│   ├── optimize-svgs.ts
│   └── bench-compare.mjs
├── src/
│   ├── index.ts             Main entry (hook exports)
│   ├── hook.ts              useResizeObserver
│   ├── hook-multi.ts        useResizeObserverEntries
│   ├── pool.ts              ObserverPool (internal)
│   ├── scheduler.ts         RafScheduler (internal)
│   ├── factory.ts           createResizeObserver
│   ├── context.ts           ResizeObserverContext
│   ├── core.ts              Framework-agnostic core
│   ├── server.ts            RSC/SSR utilities
│   ├── shim.ts              Polyfill entry
│   └── worker/
│       ├── index.ts         Worker subpath entry (re-exports hook)
│       ├── hook.ts          useResizeObserverWorker
│       ├── worker.ts        Worker thread script
│       └── protocol.ts      SAB layout + message types
├── tests/
│   ├── setup/
│   │   ├── unit.ts
│   │   └── browser.ts
│   ├── unit/
│   │   ├── pool.test.ts
│   │   ├── scheduler.test.ts
│   │   ├── hook.test.ts
│   │   ├── hook-multi.test.ts
│   │   ├── factory.test.ts
│   │   └── server.test.ts
│   ├── browser/
│   │   ├── hook.test.tsx
│   │   ├── box-models.test.tsx
│   │   ├── hook-multi.test.tsx
│   │   └── worker.test.tsx
│   └── e2e/
│       └── visualizer.spec.ts
├── wasm/
│   └── round.ts             AssemblyScript source for WASM rounding
├── .editorconfig
├── .gitignore
├── .nvmrc                   → 25
├── .npmrc
├── .size-limit.json
├── biome.json
├── tsconfig.json
├── tsconfig.build.json
├── tsconfig.test.json
├── tsdown.config.ts
├── typedoc.json
├── vitest.config.ts
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
└── package.json
```

---

## 16. ESNext Feature Matrix

A complete mapping of every ES2024–ES2026 feature to its usage in this codebase:

| Feature | Spec | Used In | Purpose |
|---------|------|---------|---------|
| `using` / `await using` | ES2026 | `pool.ts`, tests | Automatic resource disposal |
| `Promise.try()` | ES2026 | `pool.ts` | Safe async-context initialization |
| `Math.sumPrecise()` | ES2026 | `shim/wasm-round.ts` | Floating-point accumulation |
| `RegExp.escape()` | ES2026 | `bench/` | Benchmark label sanitization |
| `Float16Array` | ES2026 | `worker/protocol.ts` | SAB measurement layout |
| `Iterator.prototype.map/filter` | ES2026 | `pool.ts`, `scheduler.ts` | Zero-allocation iteration |
| `Temporal.Now.instant()` | ES2026 | `bench/` | Benchmark timestamps |
| `Error.isError()` | ES2026 | `worker/hook.ts` | Worker error discrimination |
| `Array.fromAsync()` | ES2024 | `tests/` | Async test utilities |
| `Object.groupBy()` | ES2024 | `bench/` | Result aggregation |
| `Promise.withResolvers()` | ES2024 | `worker/protocol.ts` | Async handshake |
| `structuredClone()` | ES2022 | `worker/protocol.ts` | Entry serialization |
| `WeakRef` | ES2021 | `pool.ts` | FinalizationRegistry tokens |
| `FinalizationRegistry` | ES2021 | `pool.ts` | GC-backed cleanup |
| Top-level `await` | ES2022 module | `shim.ts`, `worker/worker.ts` | Async module init |
| `import.meta.resolve()` | ES2023 | `worker/hook.ts` | Worker URL resolution |
| `#privateFields` | ES2022 | All class files | True encapsulation |
| `import type` | TS 6 | All files | Type-only imports (erasable) |
| `satisfies` operator | TS 4.9+ | Config files | Type-safe configs without widening |
| `using` declarations | TS 5.2+ / ES2026 | All resource-owning code | Explicit resource management |
| `const` type params | TS 5.0+ | Hook generics | Preserve literal types |

---

## 17. Performance Benchmark Targets

All targets measured on a mid-range development machine (Apple M2 / Node 25 / V8 13.x):

| Benchmark | Target | Tool |
|-----------|--------|------|
| Pool `observe()` throughput | > 1,000,000 ops/sec | tinybench 6.0.0 |
| Pool `unobserve()` throughput | > 1,000,000 ops/sec | tinybench 6.0.0 |
| rAF flush latency (100 elements) | < 0.1ms | tinybench 6.0.0 |
| rAF flush latency (1,000 elements) | < 1ms | tinybench 6.0.0 |
| Hook render overhead per resize | < 0.01ms above raw `useState` | tinybench 6.0.0 |
| Worker measurement latency (p50) | < 2 rAF cycles (33ms) | custom bench |
| Worker measurement latency (p99) | < 4 rAF cycles (66ms) | custom bench |
| Heap growth over 10k cycles | < 1 MB | `--heap-prof` |
| Main entry bundle (min+gzip) | **< 300 bytes** | size-limit 12.0.0 |
| Worker entry bundle (min+gzip) | **< 1,024 bytes** | size-limit 12.0.0 |
| Shim entry bundle (min+gzip) | **< 1,536 bytes** | size-limit 12.0.0 |
| tsdown full build time | < 10ms | process.hrtime |
| VitePress docs build | < 5 seconds | process.hrtime |
| CI pipeline total | < 8 minutes | GitHub Actions |
| Docs Lighthouse Performance | > 95 | Lighthouse CI |
| Docs Lighthouse Accessibility | > 98 | Lighthouse CI |

---

*Document version: 1.0.0 · @crimson_dev/use-resize-observer · March 2026*
