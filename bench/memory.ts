import { mkdirSync, writeFileSync } from 'node:fs';
import { Bench, type BenchOptions } from 'tinybench';

// Mock for Node environment
globalThis.ResizeObserver = class {
  readonly #cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.#cb = cb;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
} as unknown as typeof ResizeObserver;

globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
  cb(performance.now());
  return 0;
};
globalThis.cancelAnimationFrame = () => {};

const { ObserverPool } = await import('../src/pool.js');

const emptyOpts: ResizeObserverOptions = {};

const bench = new Bench({
  time: 2000,
  warmupTime: 500,
} as const satisfies BenchOptions);

bench.add('Memory — 1000 observe/unobserve cycles', () => {
  using pool = new ObserverPool();
  for (let i = 0; i < 1000; i++) {
    const el = { ownerDocument: {} } as unknown as Element;
    const cb = () => {};
    pool.observe(el, emptyOpts, cb);
    pool.unobserve(el, cb);
  }
});

bench.add('Memory — 10000 observe/unobserve cycles', () => {
  using pool = new ObserverPool();
  for (let i = 0; i < 10000; i++) {
    const el = { ownerDocument: {} } as unknown as Element;
    const cb = () => {};
    pool.observe(el, emptyOpts, cb);
    pool.unobserve(el, cb);
  }
});

// Capture heap baseline before benchmark run
globalThis.gc?.();
const heapBefore = structuredClone(process.memoryUsage());

await bench.run();

// Capture heap after benchmark run
globalThis.gc?.();
const heapAfter = structuredClone(process.memoryUsage());

console.table(bench.table());

// Heap delta tracking
const heapDelta = heapAfter.heapUsed - heapBefore.heapUsed;
const heapDeltaMB = heapDelta / 1024 / 1024;

console.log(`\nHeap before: ${(heapBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`Heap after: ${(heapAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`Heap delta: ${heapDeltaMB.toFixed(4)} MB`);
console.log(`Heap total: ${(heapAfter.heapTotal / 1024 / 1024).toFixed(2)} MB`);

if (Math.abs(heapDeltaMB) > 1) {
  console.warn('WARNING: Heap delta exceeds 1 MB threshold over 10k cycles');
}

mkdirSync('bench/results', { recursive: true });
const results = bench.tasks.map((task) => ({
  name: task.name,
  opsPerSecond: task.result?.hz ?? 0,
  meanTime: task.result?.mean ?? 0,
  margin: task.result?.rme ?? 0,
}));
const heapMetrics = {
  heapBeforeMB: +(heapBefore.heapUsed / 1024 / 1024).toFixed(4),
  heapAfterMB: +(heapAfter.heapUsed / 1024 / 1024).toFixed(4),
  heapDeltaMB: +heapDeltaMB.toFixed(4),
  heapTotalMB: +(heapAfter.heapTotal / 1024 / 1024).toFixed(4),
  withinThreshold: Math.abs(heapDeltaMB) <= 1,
} as const;
writeFileSync(
  'bench/results/memory.json',
  JSON.stringify({ timestamp: new Date().toISOString(), results, heapMetrics }, null, 2),
);

console.log('\n--- Memory Benchmark Complete ---');
