import { optimize } from 'svgo';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SVG_DIR = 'docs/public/diagrams';

if (!existsSync(SVG_DIR)) {
  console.log('No SVG directory found. Skipping optimization.');
  process.exit(0);
}

const files = await readdir(SVG_DIR);
const svgFiles = files.filter((f) => f.endsWith('.svg'));

if (svgFiles.length === 0) {
  console.log('No SVG files found. Skipping optimization.');
  process.exit(0);
}

await Promise.all(
  svgFiles.map(async (file) => {
    const input = await readFile(`${SVG_DIR}/${file}`, 'utf8');
    const result = optimize(input, {
      plugins: [
        'preset-default',
        'removeDimensions',
        { name: 'removeAttrs', params: { attrs: ['data-name'] } },
      ],
      multipass: true,
    });
    await writeFile(`${SVG_DIR}/${file}`, result.data);
    const savings = ((1 - result.data.length / input.length) * 100).toFixed(1);
    console.log(`  ${file}: ${input.length} -> ${result.data.length} bytes (${savings}% reduction)`);
  }),
);

console.log(`\nOptimized ${svgFiles.length} SVG files.`);
