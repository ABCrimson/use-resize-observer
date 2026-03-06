import { mkdirSync, writeFileSync } from 'node:fs';
import { Bench, type BenchOptions } from 'tinybench';

// Mock ResizeObserver for Node benchmark environment
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
  time: 1000,
  warmupTime: 500,
} as const satisfies BenchOptions);

bench.add('ObserverPool.observe() throughput', () => {
  using pool = new ObserverPool();
  const el = { ownerDocument: {} } as unknown as Element;
  const cb = () => {};
  pool.observe(el, emptyOpts, cb);
  pool.unobserve(el, cb);
});

bench.add('ObserverPool.unobserve() throughput', () => {
  using pool = new ObserverPool();
  const el = { ownerDocument: {} } as unknown as Element;
  const cb = () => {};
  pool.observe(el, emptyOpts, cb);
  pool.unobserve(el, cb);
});

bench.add('ObserverPool — 100 elements observe/unobserve cycle', () => {
  using pool = new ObserverPool();
  const elements: readonly Element[] = Array.from(
    { length: 100 },
    () => ({ ownerDocument: {} }) as unknown as Element,
  );
  const callbacks: readonly (() => void)[] = Array.from({ length: 100 }, () => () => {});

  for (let i = 0; i < 100; i++) {
    pool.observe(elements[i]!, emptyOpts, callbacks[i]!);
  }

  for (const [i, el] of elements.entries()) {
    pool.unobserve(el, callbacks[i]!);
  }
});

await bench.run();

console.table(bench.table());

mkdirSync('bench/results', { recursive: true });
const results = bench.tasks.map((task) => ({
  name: task.name,
  opsPerSecond: task.result?.hz ?? 0,
  meanTime: task.result?.mean ?? 0,
  margin: task.result?.rme ?? 0,
}));
writeFileSync(
  'bench/results/pool.json',
  JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2),
);

console.log('\n--- Pool Benchmark Complete ---');
