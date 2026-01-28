import { defineConfig } from 'tsup';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  dts: false,
  clean: true,
  shims: true,
  splitting: false,
  sourcemap: !isProduction,
  minify: isProduction,
  target: 'node18',
  outDir: 'dist',
});
