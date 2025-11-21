import { defineConfig } from 'vitest/config';

const nodeMajor = Number(process.versions.node.split('.')[0]);
const coverageProvider = nodeMajor >= 19 ? 'v8' : 'istanbul';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: coverageProvider,
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/lib/**/*.ts'],
      exclude: ['**/*.d.ts'],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 90,
      },
    },
  },
});