# Audit Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 20 audit findings — 2 critical, 3 high, 3 medium, 4 low, 5 testing gaps, 3 documentation issues.

**Architecture:** Worker mode redesigned to use main-thread ResizeObserver (DOM API unavailable in Workers) with SAB for cross-thread data sharing. Pool fixed to support constructor DI, box option re-observation, and correct FinalizationRegistry semantics. Build config corrected for shim side effects and per-entry 'use client' directives.

**Tech Stack:** TypeScript 6, React 19.3, Vitest 4.1, Biome 2.4, tsdown 0.21

---

## Task 1: Fix SAB Memory Layout + Worker Architecture (Critical — Issues 1, 2, 11)

**Files:**
- Modify: `src/worker/protocol.ts`
- Rewrite: `src/worker/hook.ts`
- Delete: `src/worker/worker.ts`
- Modify: `src/worker/index.ts`

### Design

**SAB layout collision fix:** Dirty flags (Int32Array) and float data (Float16Array) currently overlay at byte 0. Fix: reserve bytes 0–1023 for dirty flags (256 × 4B Int32), data starts at byte 1024.

**Worker architecture fix:** ResizeObserver is a DOM API — unavailable in Web Workers. Redesign: main-thread ResizeObserver writes to SAB directly (fast — no React overhead), rAF poll reads SAB and does setState. The Worker script is removed. The SAB remains useful for sharing live measurements with compute workers (WebGL, WASM).

**Dead elementId removal:** The `observe` message included `elementId` which the worker couldn't use. With worker.ts removed, the entire message protocol is eliminated.

### New protocol.ts constants:
```typescript
export const DIRTY_REGION_BYTES: number = MAX_ELEMENTS * 4; // 256 × 4 = 1024
export const DATA_OFFSET: number = DIRTY_REGION_BYTES;      // 1024
export const SAB_SIZE: number = DATA_OFFSET + (SLOT_BYTES * MAX_ELEMENTS); // 1024 + 2048 = 3072
```

### New writeSlot/readSlot offsets:
```typescript
// writeSlot: Float16Array at DATA_OFFSET + slotId * SLOT_BYTES
const view = new Float16Array(sab, DATA_OFFSET + slotId * SLOT_BYTES, 4);
// Dirty flag: Int32Array[slotId] (bytes 0–1023, no collision)
Atomics.store(new Int32Array(sab), slotId, 1);
```

### New worker/hook.ts architecture:
- Module-level shared ResizeObserver (not per-hook)
- `slotMap: Map<Element, number>` for element→slotId lookup
- Observer callback: `writeSlot(sab, slotMap.get(entry.target), entry)`
- Per-hook rAF poll loop reads SAB slot and calls setState
- Auto-cleanup: disconnect observer when last hook unmounts

---

## Task 2: Fix Pool — FinalizationRegistry, Box Re-observe, Constructor DI (High — Issues 3, 4, 5)

**Files:**
- Modify: `src/pool.ts`

### FinalizationRegistry fix (Issue 3):
WeakRef.deref() returns undefined for GC'd elements — can't call unobserve. Fix: don't try. Just decrement `#size`. The browser's ResizeObserver already stops observing GC'd targets. Change held value from `WeakRef<Element>` to `undefined`.

### Box re-observe fix (Issue 5):
Always call `this.#observer.observe(target, options)` in the `observe` method, not just for new elements. The ResizeObserver API updates options when re-observing an already-observed target.

### Constructor DI fix (Issue 4):
Accept optional `Ctor` parameter in ObserverPool constructor and getSharedPool. When custom constructor provided, create non-shared pool (for testing/SSR).

---

## Task 3: Fix Hooks — Context Integration + Map Optimization (Issues 4, 6)

**Files:**
- Modify: `src/hook.ts`
- Modify: `src/hook-multi.ts`

### Context integration (Issue 4):
Import `useResizeObserverConstructor` in both hooks. Pass constructor to `getSharedPool` when it differs from the global.

### Map optimization (Issue 6):
Add early return in setEntries when dimensions unchanged. This avoids unnecessary Map copies and React re-renders.

---

## Task 4: Fix Build Config (Issues 7, 8)

**Files:**
- Modify: `package.json`
- Modify: `tsdown.config.ts`

### sideEffects fix (Issue 7):
Change `"sideEffects": false` to `"sideEffects": ["./dist/shim.js"]`.

### Banner fix (Issue 8):
Remove global `'use client'` banner. Source files already have the directive where needed. Server and core entries must NOT have it.

---

## Task 5: Add Missing Tests (Issues 13–17)

**Files:**
- Create: `tests/unit/integration.test.ts`
- Create: `tests/unit/worker-protocol.test.ts`
- Modify: `tests/unit/hook-hardening.test.ts`
- Modify: `tests/unit/hook-multi.test.ts`
- Modify: `tests/unit/pool.test.ts`

---

## Task 6: Fix Documentation (Issues 18–20)

**Files:**
- Modify: `docs/guide/worker.md`
- Modify: `docs/guide/architecture.md`
- Modify: `docs/blog/0.9-beta.md`
- Modify: MEMORY.md version
- Grep for `createWorkerObserver` references

---

## Task 7: Verify All Quality Gates

Run: `tsc --noEmit && npx biome check ./src ./tests && npx vitest run --project unit && npm run size`
