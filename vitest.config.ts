import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    // Mirror the build-time version injection so `src` compiles under the test runner.
    __SDK_VERSION__: JSON.stringify('0.0.0-test'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts', 'src/server.ts', 'src/types.ts'],
    },
  },
});
