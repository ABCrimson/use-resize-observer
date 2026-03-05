import { Bench } from 'tinybench';

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
});

const createMockEntry = (target: Element): ResizeObserverEntry =>
  ({
    target,
    contentRect: {} as DOMRectReadOnly,
    borderBoxSize: [{ inlineSize: 100, blockSize: 50 }],
    contentBoxSize: [{ inlineSize: 100, blockSize: 50 }],
    devicePixelContentBoxSize: [{ inlineSize: 200, blockSize: 100 }],
  }) as unknown as ResizeObserverEntry;

bench.add('RafScheduler — schedule 100 elements', () => {
  const scheduler = new RafScheduler();
  for (let i = 0; i < 100; i++) {
    const el = {} as Element;
    scheduler.schedule(el, createMockEntry(el), new Set([() => {}]));
  }
  scheduler[Symbol.dispose]();
});

bench.add('RafScheduler — schedule 1000 elements', () => {
  const scheduler = new RafScheduler();
  for (let i = 0; i < 1000; i++) {
    const el = {} as Element;
    scheduler.schedule(el, createMockEntry(el), new Set([() => {}]));
  }
  scheduler[Symbol.dispose]();
});

await bench.run();

console.table(bench.table());
console.log('\n--- Scheduler Benchmark Complete ---');
