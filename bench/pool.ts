import { Bench } from 'tinybench';

// Mock ResizeObserver for Node benchmark environment
globalThis.ResizeObserver = class {
  constructor(private cb: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
  cb(performance.now());
  return 0;
};
globalThis.cancelAnimationFrame = () => {};

const { ObserverPool } = await import('../src/pool.js');

const bench = new Bench({
  time: 1000,
  warmupTime: 500,
});

bench.add('ObserverPool.observe() throughput', () => {
  const pool = new ObserverPool();
  const el = { ownerDocument: {} } as unknown as Element;
  const cb = () => {};
  pool.observe(el, {}, cb);
  pool.unobserve(el, cb);
  pool[Symbol.dispose]();
});

bench.add('ObserverPool.unobserve() throughput', () => {
  const pool = new ObserverPool();
  const el = { ownerDocument: {} } as unknown as Element;
  const cb = () => {};
  pool.observe(el, {}, cb);
  pool.unobserve(el, cb);
  pool[Symbol.dispose]();
});

bench.add('ObserverPool — 100 elements observe/unobserve cycle', () => {
  const pool = new ObserverPool();
  const elements: Element[] = [];
  const callbacks: Array<() => void> = [];

  for (let i = 0; i < 100; i++) {
    const el = { ownerDocument: {} } as unknown as Element;
    const cb = () => {};
    elements.push(el);
    callbacks.push(cb);
    pool.observe(el, {}, cb);
  }

  for (let i = 0; i < 100; i++) {
    pool.unobserve(elements[i]!, callbacks[i]!);
  }

  pool[Symbol.dispose]();
});

await bench.run();

console.table(bench.table());
console.log('\n--- Pool Benchmark Complete ---');
