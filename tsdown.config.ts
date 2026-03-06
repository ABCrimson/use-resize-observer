import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    worker: 'src/worker/index.ts',
    shim: 'src/shim.ts',
    server: 'src/server.ts',
    core: 'src/core.ts',
  },
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  dts: true,
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  treeshake: true,
  target: 'esnext',
  platform: 'browser',
  deps: {
    neverBundle: ['react', 'react-dom'],
  },
  define: {
    'import.meta.env.VERSION': JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  // No global 'use client' banner — source files have the directive where needed.
  // server.ts and core.ts must NOT have 'use client' (server-side / framework-agnostic).
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  report: true,
});
