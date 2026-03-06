import { mkdirSync, writeFileSync } from 'node:fs';
import { Bench, type BenchOptions } from 'tinybench';

const bench = new Bench({
  time: 1000,
  warmupTime: 500,
} as const satisfies BenchOptions);

bench.add('Hook import cost', async () => {
  await import('../src/hook.js');
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
  'bench/results/hook.json',
  JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2),
);

console.log('\n--- Hook Benchmark Complete ---');
