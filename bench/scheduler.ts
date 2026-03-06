import { mkdirSync, writeFileSync } from 'node:fs';
import { Bench, type BenchOptions } from 'tinybench';

// Mock startTransition for Node environment
const React = { startTransition: (fn: () => void) => fn() };
(globalThis as Record<string, unknown>).React = React;

globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
  cb(performance.now());
  return 0;
};
globalThis.cancelAnimationFrame = () => {};

const { RafScheduler } = await import('../src/scheduler.js');

const bench = new Bench({
  time: 1000,
  warmupTime: 500,
} as const satisfies BenchOptions);

const createMockEntry = (target: Element): ResizeObserverEntry =>
  ({
    target,
    contentRect: {} as DOMRectReadOnly,
    borderBoxSize: [{ inlineSize: 100, blockSize: 50 }],
    contentBoxSize: [{ inlineSize: 100, blockSize: 50 }],
    devicePixelContentBoxSize: [{ inlineSize: 200, blockSize: 100 }],
  }) as unknown as ResizeObserverEntry;

const singleCbSet: ReadonlySet<() => void> = new Set([() => {}]);

bench.add('RafScheduler — schedule 100 elements', () => {
  using scheduler = new RafScheduler();
  for (let i = 0; i < 100; i++) {
    const el = {} as Element;
    scheduler.schedule(el, createMockEntry(el), singleCbSet);
  }
});

bench.add('RafScheduler — schedule 500 elements', () => {
  using scheduler = new RafScheduler();
  for (let i = 0; i < 500; i++) {
    const el = {} as Element;
    scheduler.schedule(el, createMockEntry(el), singleCbSet);
  }
});

bench.add('RafScheduler — schedule 1000 elements', () => {
  using scheduler = new RafScheduler();
  for (let i = 0; i < 1000; i++) {
    const el = {} as Element;
    scheduler.schedule(el, createMockEntry(el), singleCbSet);
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
  'bench/results/scheduler.json',
  JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2),
);

console.log('\n--- Scheduler Benchmark Complete ---');
