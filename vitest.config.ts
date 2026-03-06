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
      {
        plugins: [
          react({
            babel: {
              plugins: ['babel-plugin-react-compiler'],
            },
          }),
        ],
        test: {
          name: 'compiler',
          include: ['tests/compiler/**/*.test.tsx'],
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
      thresholds: { lines: 95, functions: 95, branches: 85, statements: 95 },
      reporter: ['text', 'lcov', 'html'],
    },
  },
});
