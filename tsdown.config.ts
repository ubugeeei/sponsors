import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/generator.ts'],
  format: 'esm',
  target: 'node20',
  clean: true,
});
