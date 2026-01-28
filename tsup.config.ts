import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  dts: false,
  clean: true,
  shims: true,
  splitting: false,
  sourcemap: false,
  minify: false,
  target: 'node18',
  outDir: 'dist',
});
