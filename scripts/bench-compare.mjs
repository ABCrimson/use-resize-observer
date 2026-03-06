import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const BASELINE_PATH = 'bench/results/baseline.json';
const PR_PATH = 'bench/results/pr.json';
const OUTPUT_PATH = 'bench/results/comparison.json';

const baseline = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  : { benchmarks: {} };

const pr = existsSync(PR_PATH) ? JSON.parse(readFileSync(PR_PATH, 'utf8')) : { benchmarks: {} };

const comparisons = [];
let hasRegression = false;

for (const [name, prResult] of Object.entries(pr.benchmarks ?? {})) {
  const baseResult = baseline.benchmarks[name];
  if (baseResult === undefined) {
    comparisons.push({ name, status: 'new', prResult });
    continue;
  }

  const change = ((prResult.opsPerSec - baseResult.opsPerSec) / baseResult.opsPerSec) * 100;

  if (change < -10) {
    hasRegression = true;
    comparisons.push({
      name,
      status: 'regression',
      change: change.toFixed(1),
      baseResult,
      prResult,
    });
  } else if (change > 10) {
    comparisons.push({
      name,
      status: 'improvement',
      change: change.toFixed(1),
      baseResult,
      prResult,
    });
  } else {
    comparisons.push({ name, status: 'stable', change: change.toFixed(1), baseResult, prResult });
  }
}

const markdown = [
  '## Performance Benchmark Results\n',
  '| Benchmark | Status | Change |',
  '|-----------|--------|--------|',
  ...comparisons.map(
    (c) =>
      `| ${c.name} | ${c.status === 'regression' ? '⚠️' : c.status === 'improvement' ? '✅' : '➖'} ${c.status} | ${c.change ?? 'N/A'}% |`,
  ),
  '',
  hasRegression
    ? '> ⚠️ **Performance regressions detected.** Please investigate.'
    : '> ✅ No regressions detected.',
].join('\n');

writeFileSync(OUTPUT_PATH, JSON.stringify({ comparisons, markdown, hasRegression }, null, 2));
console.log(markdown);

if (hasRegression) {
  process.exit(1);
}
