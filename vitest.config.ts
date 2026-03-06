import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const browserProject = (browser: string) => ({
  plugins: [react()],
  test: {
    name: `browser:${browser}`,
    include: ['tests/browser/**/*.test.tsx'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser }],
    },
  },
});

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'happy-dom',
          setupFiles: ['tests/setup/unit.ts'],
        },
      },
      browserProject('chromium'),
      browserProject('firefox'),
      browserProject('webkit'),
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/worker/**', 'src/shim/**', 'src/index.ts', 'src/types.ts'],
      thresholds: { lines: 70, functions: 70, branches: 50, statements: 70 },
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
