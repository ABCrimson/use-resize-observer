import { mkdirSync, writeFileSync } from 'node:fs';
import { Bench, type BenchOptions } from 'tinybench';
import {
  allocateSlot,
  MAX_ELEMENTS,
  readSlot,
  releaseSlot,
  SAB_SIZE,
  writeSlot,
} from '../src/worker/protocol.js';

const bench = new Bench({
  time: 1000,
  warmupTime: 500,
} as const satisfies BenchOptions);

bench.add('Slot allocation throughput', () => {
  const bitmap = new Int32Array(MAX_ELEMENTS);
  const slot = allocateSlot(bitmap);
  if (slot >= 0) releaseSlot(bitmap, slot);
});

bench.add('Slot allocation — fill and release 256 slots', () => {
  const bitmap = new Int32Array(MAX_ELEMENTS);
  const slots: readonly number[] = Array.from({ length: MAX_ELEMENTS }, () => allocateSlot(bitmap));
  for (const slot of slots) {
    releaseSlot(bitmap, slot);
  }
});

const createMockEntry = (): ResizeObserverEntry =>
  ({
    target: {} as Element,
    contentRect: {} as DOMRectReadOnly,
    borderBoxSize: [{ inlineSize: 100, blockSize: 50 }],
    contentBoxSize: [{ inlineSize: 200, blockSize: 100 }],
    devicePixelContentBoxSize: [{ inlineSize: 400, blockSize: 200 }],
  }) as unknown as ResizeObserverEntry;

bench.add('writeSlot/readSlot roundtrip latency', () => {
  const sab = new SharedArrayBuffer(SAB_SIZE);
  const entry = createMockEntry();
  const slotId = 0;
  writeSlot(sab, slotId, entry);
  const measurement = readSlot(sab, slotId);
  // Prevent dead-code elimination
  if (measurement.width < 0) throw new Error('unreachable');
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
  'bench/results/worker.json',
  JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2),
);

console.log('\n--- Worker Benchmark Complete ---');
