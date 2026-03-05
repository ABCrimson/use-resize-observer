import { Bench } from 'tinybench';
import { allocateSlot, releaseSlot, MAX_ELEMENTS } from '../src/worker/protocol.js';

const bench = new Bench({
  time: 1000,
  warmupTime: 500,
});

bench.add('Slot allocation throughput', () => {
  const bitmap = new Int32Array(MAX_ELEMENTS);
  const slot = allocateSlot(bitmap);
  if (slot >= 0) releaseSlot(bitmap, slot);
});

bench.add('Slot allocation — fill and release 256 slots', () => {
  const bitmap = new Int32Array(MAX_ELEMENTS);
  const slots: number[] = [];
  for (let i = 0; i < MAX_ELEMENTS; i++) {
    slots.push(allocateSlot(bitmap));
  }
  for (const slot of slots) {
    releaseSlot(bitmap, slot);
  }
});

await bench.run();

console.table(bench.table());
console.log('\n--- Worker Benchmark Complete ---');
