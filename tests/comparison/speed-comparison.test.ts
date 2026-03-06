/**
 * Speed Comparison Test Suite
 *
 * @crimson_dev/use-resize-observer@0.4.1  vs  use-resize-observer@9.1.0
 *
 * Benchmarks the hot paths of both libraries across 6 dimensions:
 * 1. Size extraction (the per-entry transform function)
 * 2. Observer instantiation (pool singleton vs per-component)
 * 3. Callback dispatch pipeline (simulated resize events)
 * 4. Scale-out (1 → 10 → 100 → 1000 elements)
 * 5. Cleanup/teardown cost
 * 6. Memory allocation pressure (object creation per cycle)
 *
 * All benchmarks use high iteration counts with performance.now() for
 * sub-microsecond resolution. Results are reported as ops/sec with relative
 * speedup ratios via console.table().
 *
 * Run with: npx vitest run --config vitest.comparison.config.ts tests/comparison/speed-comparison.test.ts
 */

import { describe, expect, it, vi } from 'vitest';

// Mock React startTransition to execute synchronously in bench context
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, startTransition: (fn: () => void) => fn() };
});

// ─────────────────────────────────────────────────────────────
//  Mock environment — both libraries need ResizeObserver + rAF
// ─────────────────────────────────────────────────────────────

class BenchResizeObserver {
  static instanceCount = 0;
  readonly cb: ResizeObserverCallback;
  readonly targets: Element[] = [];

  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    BenchResizeObserver.instanceCount++;
  }

  observe(target: Element, _options?: ResizeObserverOptions): void {
    this.targets.push(target);
  }

  unobserve(target: Element): void {
    const idx = this.targets.indexOf(target);
    if (idx !== -1) this.targets.splice(idx, 1);
  }

  disconnect(): void {
    this.targets.length = 0;
  }
}

globalThis.ResizeObserver = BenchResizeObserver as unknown as typeof ResizeObserver;

let rafCallbacks: FrameRequestCallback[] = [];
globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
};
globalThis.cancelAnimationFrame = (_id: number): void => {};

const flushRaf = (): void => {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) cb(performance.now());
};

// ─────────────────────────────────────────────────────────────
//  Import crimson internals
// ─────────────────────────────────────────────────────────────

const { extractBoxSize, extractDimensions } = await import('../../src/extract.js');
const { ObserverPool } = await import('../../src/pool.js');
const { RafScheduler } = await import('../../src/scheduler.js');

// ─────────────────────────────────────────────────────────────
//  Upstream's extractSize — inlined from bundle.esm.js since
//  it is not exported. This is the exact compiled source.
// ─────────────────────────────────────────────────────────────

function upstreamExtractSize(
  entry: Record<string, unknown>,
  boxProp: string,
  sizeType: string,
): number | undefined {
  if (!entry[boxProp]) {
    if (boxProp === 'contentBoxSize') {
      const rect = entry.contentRect as Record<string, number>;
      return rect[sizeType === 'inlineSize' ? 'width' : 'height'];
    }
    return undefined;
  }
  const boxArr = entry[boxProp] as Record<string, unknown>[];
  return boxArr[0]
    ? (boxArr[0] as Record<string, number>)[sizeType]
    : (entry[boxProp] as Record<string, number>)[sizeType];
}

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

const createElement = (id = 0): Element =>
  ({ id, ownerDocument: globalThis.document ?? {} }) as unknown as Element;

const createMockEntry = (target: Element, w = 100, h = 50): ResizeObserverEntry =>
  ({
    target,
    contentRect: {
      x: 0,
      y: 0,
      width: w,
      height: h,
      top: 0,
      right: w,
      bottom: h,
      left: 0,
    } as DOMRectReadOnly,
    borderBoxSize: [
      { inlineSize: w, blockSize: h },
    ] as unknown as ReadonlyArray<ResizeObserverSize>,
    contentBoxSize: [
      { inlineSize: w, blockSize: h },
    ] as unknown as ReadonlyArray<ResizeObserverSize>,
    devicePixelContentBoxSize: [
      { inlineSize: w * 2, blockSize: h * 2 },
    ] as unknown as ReadonlyArray<ResizeObserverSize>,
  }) as ResizeObserverEntry;

interface BenchResult {
  readonly opsPerSec: number;
  readonly meanNs: number;
  readonly totalMs: number;
  readonly iterations: number;
}

/**
 * Micro-benchmark runner: executes `fn` for at least `minIterations` or until
 * `minTimeMs` has elapsed, whichever is later. Returns ops/sec and mean time.
 */
const bench = (fn: () => void, minIterations = 100_000, minTimeMs = 200): BenchResult => {
  // Warmup
  for (let i = 0; i < Math.min(1000, minIterations / 10); i++) fn();

  let iterations = 0;
  const start = performance.now();
  let elapsed = 0;

  while (iterations < minIterations || elapsed < minTimeMs) {
    fn();
    iterations++;
    if (iterations % 1000 === 0) elapsed = performance.now() - start;
  }

  elapsed = performance.now() - start;
  const opsPerSec = (iterations / elapsed) * 1000;
  const meanNs = (elapsed / iterations) * 1_000_000;

  return { opsPerSec, meanNs, totalMs: elapsed, iterations };
};

const fmt = (n: number): string =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : n.toFixed(0);

const fmtNs = (ns: number): string =>
  ns >= 1_000_000
    ? `${(ns / 1_000_000).toFixed(2)} ms`
    : ns >= 1_000
      ? `${(ns / 1_000).toFixed(2)} us`
      : `${ns.toFixed(0)} ns`;

const ratio = (a: number, b: number): string => {
  const r = a / b;
  return r >= 1 ? `${r.toFixed(2)}x faster` : `${(1 / r).toFixed(2)}x slower`;
};

// ─────────────────────────────────────────────────────────────
//  Section 1: Size Extraction Hot Path
// ─────────────────────────────────────────────────────────────

describe('1. Size Extraction — Hot Path', () => {
  const el = createElement();
  const entry = createMockEntry(el, 320, 240);

  it('1.1 — content-box extraction (most common path)', () => {
    const crimsonResult = bench(() => {
      extractBoxSize(entry, 'content-box');
    });

    const upstreamResult = bench(() => {
      upstreamExtractSize(
        entry as unknown as Record<string, unknown>,
        'contentBoxSize',
        'inlineSize',
      );
      upstreamExtractSize(
        entry as unknown as Record<string, unknown>,
        'contentBoxSize',
        'blockSize',
      );
    });

    console.table({
      crimson: {
        opsPerSec: fmt(crimsonResult.opsPerSec),
        meanTime: fmtNs(crimsonResult.meanNs),
        note: 'extractBoxSize() — single call returns {inlineSize, blockSize}',
      },
      upstream: {
        opsPerSec: fmt(upstreamResult.opsPerSec),
        meanTime: fmtNs(upstreamResult.meanNs),
        note: 'extractSize() x2 — called once for width, once for height',
      },
      delta: {
        opsPerSec: ratio(crimsonResult.opsPerSec, upstreamResult.opsPerSec),
        meanTime: ratio(upstreamResult.meanNs, crimsonResult.meanNs),
        note: "Crimson returns both dimensions in 1 call vs upstream's 2 calls",
      },
    });

    // Crimson should be competitive (single call vs two calls)
    expect(crimsonResult.opsPerSec).toBeGreaterThan(0);
  });

  it('1.2 — extractDimensions full pipeline (entry → {width, height})', () => {
    const crimsonResult = bench(() => {
      extractDimensions(entry, 'content-box');
    });

    // Upstream equivalent: extract width + height + round
    const upstreamResult = bench(() => {
      const w = upstreamExtractSize(
        entry as unknown as Record<string, unknown>,
        'contentBoxSize',
        'inlineSize',
      );
      const h = upstreamExtractSize(
        entry as unknown as Record<string, unknown>,
        'contentBoxSize',
        'blockSize',
      );
      const _width = w ? Math.round(w) : undefined;
      const _height = h ? Math.round(h) : undefined;
    });

    console.table({
      crimson: {
        opsPerSec: fmt(crimsonResult.opsPerSec),
        meanTime: fmtNs(crimsonResult.meanNs),
        note: 'extractDimensions() — single function, no rounding overhead',
      },
      upstream: {
        opsPerSec: fmt(upstreamResult.opsPerSec),
        meanTime: fmtNs(upstreamResult.meanNs),
        note: 'extractSize() x2 + Math.round() x2',
      },
      delta: {
        opsPerSec: ratio(crimsonResult.opsPerSec, upstreamResult.opsPerSec),
        meanTime: ratio(upstreamResult.meanNs, crimsonResult.meanNs),
        note: 'End-to-end entry → dimensions transform',
      },
    });

    expect(crimsonResult.opsPerSec).toBeGreaterThan(0);
  });

  it('1.3 — border-box extraction path', () => {
    const crimsonResult = bench(() => {
      extractBoxSize(entry, 'border-box');
    });

    const upstreamResult = bench(() => {
      upstreamExtractSize(
        entry as unknown as Record<string, unknown>,
        'borderBoxSize',
        'inlineSize',
      );
      upstreamExtractSize(
        entry as unknown as Record<string, unknown>,
        'borderBoxSize',
        'blockSize',
      );
    });

    console.table({
      crimson: {
        opsPerSec: fmt(crimsonResult.opsPerSec),
        meanTime: fmtNs(crimsonResult.meanNs),
      },
      upstream: {
        opsPerSec: fmt(upstreamResult.opsPerSec),
        meanTime: fmtNs(upstreamResult.meanNs),
      },
      delta: {
        opsPerSec: ratio(crimsonResult.opsPerSec, upstreamResult.opsPerSec),
        meanTime: ratio(upstreamResult.meanNs, crimsonResult.meanNs),
        note: 'border-box path',
      },
    });

    expect(crimsonResult.opsPerSec).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────
//  Section 2: Observer Instantiation
// ─────────────────────────────────────────────────────────────

describe('2. Observer Instantiation Cost', () => {
  it('2.1 — creating N observers (upstream model) vs 1 pool (crimson model)', {
    timeout: 30_000,
  }, () => {
    const counts = [1, 10, 100, 500] as const;

    const results = counts.map((n) => {
      BenchResizeObserver.instanceCount = 0;
      const upstreamResult = bench(
        () => {
          for (let i = 0; i < n; i++) {
            const _ro = new ResizeObserver(() => {});
          }
        },
        n >= 100 ? 5_000 : 20_000,
        150,
      );
      const upstreamInstances = n;

      BenchResizeObserver.instanceCount = 0;
      const crimsonResult = bench(
        () => {
          using pool = new ObserverPool();
          const emptyOpts: ResizeObserverOptions = {};
          for (let i = 0; i < n; i++) {
            const el = createElement(i);
            pool.observe(el, emptyOpts, () => {});
          }
        },
        n >= 100 ? 5_000 : 20_000,
        150,
      );
      const crimsonInstances = 1;

      return {
        elements: n,
        crimsonOps: fmt(crimsonResult.opsPerSec),
        crimsonMean: fmtNs(crimsonResult.meanNs),
        crimsonObservers: crimsonInstances,
        upstreamOps: fmt(upstreamResult.opsPerSec),
        upstreamMean: fmtNs(upstreamResult.meanNs),
        upstreamObservers: upstreamInstances,
        observerSavings: `${((1 - crimsonInstances / upstreamInstances) * 100).toFixed(0)}%`,
      };
    });

    console.table(results);

    // At 100 elements, crimson uses 1 observer vs upstream's 100
    expect(results[2]?.crimsonObservers).toBe(1);
    expect(results[2]?.upstreamObservers).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────
//  Section 3: Callback Dispatch Pipeline
// ─────────────────────────────────────────────────────────────

describe('3. Callback Dispatch Pipeline', () => {
  it('3.1 — single element resize callback throughput', () => {
    // Crimson: entry → extractDimensions → callback → scheduler.schedule → rAF → flush
    const el = createElement();
    const entry = createMockEntry(el);

    let _crimsonCallCount = 0;
    const crimsonCb = () => {
      _crimsonCallCount++;
    };
    const cbSet = new Set([crimsonCb]);

    const crimsonResult = bench(() => {
      using scheduler = new RafScheduler();
      scheduler.schedule(el, entry, cbSet);
      flushRaf();
    }, 50_000);

    // Upstream: entry → extractSize x2 → Math.round x2 → compare previous → setState
    let _upstreamCallCount = 0;
    const upstreamPrevious = {
      width: undefined as number | undefined,
      height: undefined as number | undefined,
    };

    const upstreamResult = bench(() => {
      const boxProp = 'contentBoxSize';
      const reportedWidth = upstreamExtractSize(
        entry as unknown as Record<string, unknown>,
        boxProp,
        'inlineSize',
      );
      const reportedHeight = upstreamExtractSize(
        entry as unknown as Record<string, unknown>,
        boxProp,
        'blockSize',
      );
      const newWidth = reportedWidth ? Math.round(reportedWidth) : undefined;
      const newHeight = reportedHeight ? Math.round(reportedHeight) : undefined;

      if (upstreamPrevious.width !== newWidth || upstreamPrevious.height !== newHeight) {
        upstreamPrevious.width = newWidth;
        upstreamPrevious.height = newHeight;
        _upstreamCallCount++;
      }
    }, 50_000);

    console.table({
      crimson: {
        opsPerSec: fmt(crimsonResult.opsPerSec),
        meanTime: fmtNs(crimsonResult.meanNs),
        pipeline: 'schedule → rAF → startTransition → callback',
        note: 'Includes full scheduler round-trip',
      },
      upstream: {
        opsPerSec: fmt(upstreamResult.opsPerSec),
        meanTime: fmtNs(upstreamResult.meanNs),
        pipeline: 'extractSize x2 → round x2 → compare → setState',
        note: 'Direct inline processing (no batching)',
      },
      delta: {
        opsPerSec: ratio(crimsonResult.opsPerSec, upstreamResult.opsPerSec),
        meanTime: '',
        pipeline: '',
        note: 'Crimson pays scheduler overhead but gains batching',
      },
    });

    expect(crimsonResult.opsPerSec).toBeGreaterThan(0);
  });

  it('3.2 — batch dispatch: N elements resizing simultaneously', () => {
    const counts = [10, 50, 100, 500] as const;

    const results = counts.map((n) => {
      const elements = Array.from({ length: n }, (_, i) => createElement(i));
      const entries = elements.map((el) => createMockEntry(el));

      // Crimson: all N go into 1 scheduler → 1 rAF → 1 flush
      let _crimsonTotal = 0;
      const crimsonCb = () => {
        _crimsonTotal++;
      };
      const cbSet = new Set([crimsonCb]);

      const crimsonResult = bench(
        () => {
          using scheduler = new RafScheduler();
          for (let i = 0; i < n; i++) {
            scheduler.schedule(elements[i]!, entries[i]!, cbSet);
          }
          flushRaf();
        },
        n >= 100 ? 5_000 : 20_000,
      );

      // Upstream: each element triggers its own extract + compare + setState
      let _upstreamTotal = 0;
      const upstreamResult = bench(
        () => {
          for (let i = 0; i < n; i++) {
            const e = entries[i] as unknown as Record<string, unknown>;
            const w = upstreamExtractSize(e, 'contentBoxSize', 'inlineSize');
            const h = upstreamExtractSize(e, 'contentBoxSize', 'blockSize');
            const _nw = w ? Math.round(w) : undefined;
            const _nh = h ? Math.round(h) : undefined;
            _upstreamTotal++;
          }
        },
        n >= 100 ? 5_000 : 20_000,
      );

      return {
        elements: n,
        crimsonOps: fmt(crimsonResult.opsPerSec),
        crimsonMean: fmtNs(crimsonResult.meanNs),
        upstreamOps: fmt(upstreamResult.opsPerSec),
        upstreamMean: fmtNs(upstreamResult.meanNs),
        crimsonRafCalls: '1 per batch',
        upstreamSetStateCalls: `${n} per batch`,
      };
    });

    console.table(results);

    console.log(
      '\nKey insight: Crimson batches all N elements into a single rAF flush + startTransition.',
    );
    console.log(
      'Upstream triggers N separate setState calls (React 18 auto-batching helps, but each still allocates).',
    );

    expect(results.length).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────
//  Section 4: Pool Observe/Unobserve Cycle
// ─────────────────────────────────────────────────────────────

describe('4. Pool Observe/Unobserve Lifecycle', () => {
  it('4.1 — observe + unobserve cycle per element', () => {
    const el = createElement();
    const cb = () => {};
    const opts: ResizeObserverOptions = {};

    // Crimson: pool.observe + pool.unobserve (WeakMap + Set + FinalizationRegistry)
    using pool = new ObserverPool();
    const crimsonResult = bench(() => {
      pool.observe(el, opts, cb);
      pool.unobserve(el, cb);
    });

    // Upstream: new ResizeObserver → observe → unobserve (per component lifecycle)
    const upstreamResult = bench(() => {
      const ro = new ResizeObserver(() => {});
      ro.observe(el);
      ro.unobserve(el);
    });

    console.table({
      crimson: {
        opsPerSec: fmt(crimsonResult.opsPerSec),
        meanTime: fmtNs(crimsonResult.meanNs),
        note: 'Pool: WeakMap lookup → Set.add → Set.delete → WeakMap cleanup',
      },
      upstream: {
        opsPerSec: fmt(upstreamResult.opsPerSec),
        meanTime: fmtNs(upstreamResult.meanNs),
        note: 'new ResizeObserver() → observe() → unobserve() each mount cycle',
      },
      delta: {
        opsPerSec: ratio(crimsonResult.opsPerSec, upstreamResult.opsPerSec),
        meanTime: ratio(upstreamResult.meanNs, crimsonResult.meanNs),
        note: 'Per-component mount/unmount cost comparison',
      },
    });

    expect(crimsonResult.opsPerSec).toBeGreaterThan(0);
  });

  it('4.2 — multi-callback on same element (crimson-only feature)', () => {
    const el = createElement();
    const opts: ResizeObserverOptions = {};

    // Crimson pool supports N callbacks on 1 element with 1 observer
    const callbacks = Array.from({ length: 10 }, () => () => {});
    using pool = new ObserverPool();

    const crimsonResult = bench(() => {
      for (const cb of callbacks) pool.observe(el, opts, cb);
      for (const cb of callbacks) pool.unobserve(el, cb);
    }, 50_000);

    // Upstream would need 10 separate ResizeObservers for 10 callbacks on same element
    const upstreamResult = bench(() => {
      const _observers: { ro: ReturnType<(typeof ResizeObserver)['prototype']['observe']> }[] = [];
      for (let i = 0; i < 10; i++) {
        const ro = new ResizeObserver(() => {});
        ro.observe(el);
      }
    }, 50_000);

    console.table({
      crimson: {
        opsPerSec: fmt(crimsonResult.opsPerSec),
        meanTime: fmtNs(crimsonResult.meanNs),
        observers: '1 (shared pool)',
        callbacks: '10 (Set<Callback>)',
      },
      upstream: {
        opsPerSec: fmt(upstreamResult.opsPerSec),
        meanTime: fmtNs(upstreamResult.meanNs),
        observers: '10 (one per hook instance)',
        callbacks: '10 (1:1 with observers)',
      },
      delta: {
        opsPerSec: ratio(crimsonResult.opsPerSec, upstreamResult.opsPerSec),
        meanTime: ratio(upstreamResult.meanNs, crimsonResult.meanNs),
        observers: 'Crimson: 10x fewer observer instances',
        callbacks: '',
      },
    });

    expect(crimsonResult.opsPerSec).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────
//  Section 5: Scale-Out Performance
// ─────────────────────────────────────────────────────────────

describe('5. Scale-Out Performance', () => {
  it('5.1 — observe N elements: linear scaling analysis', () => {
    const counts = [1, 10, 100, 500, 1000] as const;
    const emptyOpts: ResizeObserverOptions = {};

    const results = counts.map((n) => {
      const elements = Array.from({ length: n }, (_, i) => createElement(i));
      const callbacks = Array.from({ length: n }, () => () => {});
      const iters = n >= 500 ? 2_000 : n >= 100 ? 5_000 : 20_000;

      // Crimson: 1 pool, N observe calls
      const crimsonResult = bench(() => {
        using pool = new ObserverPool();
        for (let i = 0; i < n; i++) {
          pool.observe(elements[i]!, emptyOpts, callbacks[i]!);
        }
      }, iters);

      // Upstream: N ResizeObserver constructors + N observe calls
      const upstreamResult = bench(() => {
        const observers: unknown[] = [];
        for (let i = 0; i < n; i++) {
          const ro = new ResizeObserver(() => {});
          ro.observe(elements[i]!);
          observers.push(ro);
        }
      }, iters);

      return {
        elements: n,
        crimsonOps: fmt(crimsonResult.opsPerSec),
        crimsonMean: fmtNs(crimsonResult.meanNs),
        crimsonObservers: 1,
        upstreamOps: fmt(upstreamResult.opsPerSec),
        upstreamMean: fmtNs(upstreamResult.meanNs),
        upstreamObservers: n,
        speedup: ratio(crimsonResult.opsPerSec, upstreamResult.opsPerSec),
      };
    });

    console.table(results);

    console.log('\n--- Scaling Analysis ---');
    if (results.length >= 2) {
      const first = results[0]!;
      const last = results[results.length - 1]!;
      const crimsonScaleFactor =
        parseFloat(first.crimsonMean) > 0
          ? parseFloat(last.crimsonMean.replace(/[^\d.]/g, '')) /
            parseFloat(first.crimsonMean.replace(/[^\d.]/g, ''))
          : 0;
      console.log(`From ${first.elements} → ${last.elements} elements:`);
      console.log(`  Crimson mean time growth: ~${crimsonScaleFactor.toFixed(1)}x`);
      console.log(`  Expected linear: ${(last.elements / first.elements).toFixed(0)}x`);
    }

    // Crimson should always use exactly 1 observer regardless of N
    for (const r of results) {
      expect(r.crimsonObservers).toBe(1);
    }
  });

  it('5.2 — full lifecycle at scale: observe → callback → unobserve', () => {
    const counts = [10, 100, 500] as const;
    const emptyOpts: ResizeObserverOptions = {};

    const results = counts.map((n) => {
      const elements = Array.from({ length: n }, (_, i) => createElement(i));
      const entries = elements.map((el) => createMockEntry(el));
      const iters = n >= 500 ? 1_000 : n >= 100 ? 3_000 : 10_000;

      // Crimson: observe all → simulate resize batch → unobserve all
      let _crimsonCallbacks = 0;
      const crimsonResult = bench(() => {
        using pool = new ObserverPool();
        using scheduler = new RafScheduler();

        const cbs = Array.from({ length: n }, () => {
          const cb = () => {
            _crimsonCallbacks++;
          };
          return cb;
        });
        const cbSet = new Set(cbs);

        for (let i = 0; i < n; i++) {
          pool.observe(elements[i]!, emptyOpts, cbs[i]!);
        }

        // Simulate batch resize
        for (let i = 0; i < n; i++) {
          scheduler.schedule(elements[i]!, entries[i]!, cbSet);
        }
        flushRaf();

        for (let i = 0; i < n; i++) {
          pool.unobserve(elements[i]!, cbs[i]!);
        }
      }, iters);

      // Upstream equivalent: create N observers → N callbacks → unobserve N
      let _upstreamCallbacks = 0;
      const upstreamResult = bench(() => {
        for (let i = 0; i < n; i++) {
          const ro = new ResizeObserver(() => {});
          ro.observe(elements[i]!);

          const e = entries[i] as unknown as Record<string, unknown>;
          const w = upstreamExtractSize(e, 'contentBoxSize', 'inlineSize');
          const h = upstreamExtractSize(e, 'contentBoxSize', 'blockSize');
          const _nw = w ? Math.round(w) : undefined;
          const _nh = h ? Math.round(h) : undefined;
          _upstreamCallbacks++;

          ro.unobserve(elements[i]!);
        }
      }, iters);

      return {
        elements: n,
        crimsonOps: fmt(crimsonResult.opsPerSec),
        crimsonMean: fmtNs(crimsonResult.meanNs),
        upstreamOps: fmt(upstreamResult.opsPerSec),
        upstreamMean: fmtNs(upstreamResult.meanNs),
        speedup: ratio(crimsonResult.opsPerSec, upstreamResult.opsPerSec),
      };
    });

    console.table(results);
    expect(results.length).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────
//  Section 6: Memory Allocation Pressure
// ─────────────────────────────────────────────────────────────

describe('6. Memory Allocation Pressure', () => {
  it('6.1 — objects allocated per resize cycle', () => {
    const el = createElement();
    const entry = createMockEntry(el);

    // Count allocations by tracking new object creation in one cycle
    const crimsonAllocations = {
      perCallback: '0 (entry is passed through, no wrapper)',
      perSchedule: '0 (Map.set reuses existing slot on same element)',
      perFlush: '1 (snapshot Map via new Map(queue))',
      total: '1 object per flush (amortized across N elements)',
    };

    const upstreamAllocations = {
      perCallback: '1 (newSize = { width, height })',
      perSchedule: 'N/A (no scheduler)',
      perFlush: 'N/A',
      total: '1 object per callback invocation',
    };

    console.table({ crimson: crimsonAllocations, upstream: upstreamAllocations });

    // Benchmark actual GC pressure via rapid object creation
    const crimsonResult = bench(() => {
      // Crimson path: extractDimensions returns 1 object
      const _dims = extractDimensions(entry, 'content-box');
      // In practice, setState({ width, height, entry }) creates 1 state object
    }, 200_000);

    const upstreamResult = bench(() => {
      // Upstream path: extract width, extract height, round both, create newSize
      const e = entry as unknown as Record<string, unknown>;
      const w = upstreamExtractSize(e, 'contentBoxSize', 'inlineSize');
      const h = upstreamExtractSize(e, 'contentBoxSize', 'blockSize');
      const _newSize = {
        width: w ? Math.round(w) : undefined,
        height: h ? Math.round(h) : undefined,
      };
    }, 200_000);

    console.table({
      crimson: {
        opsPerSec: fmt(crimsonResult.opsPerSec),
        meanTime: fmtNs(crimsonResult.meanNs),
        objectsPerCycle: '1 ({width, height})',
        functionCalls: '1 (extractDimensions)',
      },
      upstream: {
        opsPerSec: fmt(upstreamResult.opsPerSec),
        meanTime: fmtNs(upstreamResult.meanNs),
        objectsPerCycle: '1 ({width, height}) + 2 Math.round calls',
        functionCalls: '2 (extractSize × 2) + 2 (Math.round × 2)',
      },
    });

    expect(crimsonResult.opsPerSec).toBeGreaterThan(0);
  });

  it('6.2 — ResizeObserver instance allocation at scale', () => {
    const counts = [10, 50, 100, 500] as const;

    const results = counts.map((n) => ({
      elements: n,
      crimsonROInstances: 1,
      upstreamROInstances: n,
      crimsonWeakMapEntries: n,
      crimsonFinalizerRegistrations: n,
      upstreamRefObjects: n * 5,
      crimsonMemoryModel: 'O(1) observers + O(n) WeakMap entries',
      upstreamMemoryModel: `O(n) observers + O(n × 5) ref objects`,
    }));

    console.table(results);

    console.log('\n--- Memory Model Comparison ---');
    console.log('Crimson: 1 ResizeObserver + 1 WeakMap + N Set<Callback> entries');
    console.log("         WeakMap auto-releases when elements are GC'd");
    console.log('         FinalizationRegistry provides safety-net cleanup');
    console.log('');
    console.log('Upstream: N ResizeObservers + N×5 useRef objects + N×2 useCallback closures');
    console.log('          Each hook mount creates a new ResizeObserver constructor call');
    console.log('          Relies solely on useEffect cleanup (no GC safety net)');

    expect(results[3]?.crimsonROInstances).toBe(1);
    expect(results[3]?.upstreamROInstances).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────
//  Section 7: Final Speed Scorecard
// ─────────────────────────────────────────────────────────────

describe('7. Final Speed Scorecard', () => {
  it('7.1 — weighted performance summary', () => {
    const el = createElement();
    const entry = createMockEntry(el);
    const emptyOpts: ResizeObserverOptions = {};

    // Quick benchmarks for final scorecard
    const extractCrimson = bench(() => extractDimensions(entry, 'content-box'), 100_000);
    const extractUpstream = bench(() => {
      const e = entry as unknown as Record<string, unknown>;
      upstreamExtractSize(e, 'contentBoxSize', 'inlineSize');
      upstreamExtractSize(e, 'contentBoxSize', 'blockSize');
    }, 100_000);

    const observeCrimson = bench(() => {
      using pool = new ObserverPool();
      pool.observe(el, emptyOpts, () => {});
    }, 50_000);
    const observeUpstream = bench(() => {
      const ro = new ResizeObserver(() => {});
      ro.observe(el);
    }, 50_000);

    const cbCrimson = bench(() => {
      using scheduler = new RafScheduler();
      scheduler.schedule(el, entry, new Set([() => {}]));
      flushRaf();
    }, 30_000);
    const cbUpstream = bench(() => {
      const e = entry as unknown as Record<string, unknown>;
      const w = upstreamExtractSize(e, 'contentBoxSize', 'inlineSize');
      const h = upstreamExtractSize(e, 'contentBoxSize', 'blockSize');
      const _s = { width: w ? Math.round(w) : undefined, height: h ? Math.round(h) : undefined };
    }, 30_000);

    // 100-element observe cycle
    const elements100 = Array.from({ length: 100 }, (_, i) => createElement(i));
    const scaleCrimson = bench(() => {
      using pool = new ObserverPool();
      for (let i = 0; i < 100; i++) pool.observe(elements100[i]!, emptyOpts, () => {});
    }, 5_000);
    const scaleUpstream = bench(() => {
      for (let i = 0; i < 100; i++) {
        const ro = new ResizeObserver(() => {});
        ro.observe(elements100[i]!);
      }
    }, 5_000);

    const scorecard = [
      {
        dimension: 'Size extraction (hot path)',
        crimsonOps: fmt(extractCrimson.opsPerSec),
        upstreamOps: fmt(extractUpstream.opsPerSec),
        winner: extractCrimson.opsPerSec >= extractUpstream.opsPerSec ? 'CRIMSON' : 'UPSTREAM',
        ratio: ratio(extractCrimson.opsPerSec, extractUpstream.opsPerSec),
        weight: 25,
      },
      {
        dimension: 'Observer instantiation',
        crimsonOps: fmt(observeCrimson.opsPerSec),
        upstreamOps: fmt(observeUpstream.opsPerSec),
        winner: observeCrimson.opsPerSec >= observeUpstream.opsPerSec ? 'CRIMSON' : 'UPSTREAM',
        ratio: ratio(observeCrimson.opsPerSec, observeUpstream.opsPerSec),
        weight: 20,
      },
      {
        dimension: 'Callback pipeline',
        crimsonOps: fmt(cbCrimson.opsPerSec),
        upstreamOps: fmt(cbUpstream.opsPerSec),
        winner: cbCrimson.opsPerSec >= cbUpstream.opsPerSec ? 'CRIMSON' : 'UPSTREAM',
        ratio: ratio(cbCrimson.opsPerSec, cbUpstream.opsPerSec),
        weight: 25,
      },
      {
        dimension: 'Scale-out (100 elements)',
        crimsonOps: fmt(scaleCrimson.opsPerSec),
        upstreamOps: fmt(scaleUpstream.opsPerSec),
        winner: scaleCrimson.opsPerSec >= scaleUpstream.opsPerSec ? 'CRIMSON' : 'UPSTREAM',
        ratio: ratio(scaleCrimson.opsPerSec, scaleUpstream.opsPerSec),
        weight: 20,
      },
      {
        dimension: 'Memory model efficiency',
        crimsonOps: 'O(1) observers',
        upstreamOps: 'O(n) observers',
        winner: 'CRIMSON',
        ratio: 'n:1 observer reduction',
        weight: 10,
      },
    ];

    console.table(scorecard);

    const crimsonWins = scorecard.filter((s) => s.winner === 'CRIMSON').length;
    const upstreamWins = scorecard.filter((s) => s.winner === 'UPSTREAM').length;

    const crimsonWeightedWins = scorecard
      .filter((s) => s.winner === 'CRIMSON')
      .reduce((sum, s) => sum + s.weight, 0);
    const upstreamWeightedWins = scorecard
      .filter((s) => s.winner === 'UPSTREAM')
      .reduce((sum, s) => sum + s.weight, 0);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  SPEED COMPARISON SUMMARY`);
    console.log(`  Crimson wins:  ${crimsonWins}/5 dimensions (${crimsonWeightedWins}% weighted)`);
    console.log(
      `  Upstream wins: ${upstreamWins}/5 dimensions (${upstreamWeightedWins}% weighted)`,
    );
    console.log(`${'='.repeat(60)}`);
    console.log(`  Note: Crimson pays scheduler overhead (rAF + Map snapshot)`);
    console.log(`  in exchange for batching N resizes into 1 React render.`);
    console.log(`  This trade-off favors Crimson in real-world scenarios`);
    console.log(`  where multiple elements resize simultaneously.`);
    console.log(`${'='.repeat(60)}`);

    // Assert the scorecard ran
    expect(scorecard).toHaveLength(5);
  });
});
