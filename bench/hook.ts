import { Bench } from 'tinybench';

const bench = new Bench({
  time: 1000,
  warmupTime: 500,
});

bench.add('Hook import cost', async () => {
  await import('../src/hook.js');
});

await bench.run();

console.table(bench.table());
console.log('\n--- Hook Benchmark Complete ---');
