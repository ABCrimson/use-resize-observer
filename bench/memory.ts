import { Bench } from 'tinybench';

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

/** Shared empty options object — avoids allocation per iteration. */
const emptyOpts: ResizeObserverOptions = {};

const bench = new Bench({
  time: 2000,
  warmupTime: 500,
});

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

await bench.run();

console.table(bench.table());

// Report heap usage — structuredClone snapshot for consistent reporting
const mem = structuredClone(process.memoryUsage());
console.log('\nHeap used:', (mem.heapUsed / 1024 / 1024).toFixed(2), 'MB');
console.log('Heap total:', (mem.heapTotal / 1024 / 1024).toFixed(2), 'MB');
console.log('\n--- Memory Benchmark Complete ---');
