// eslint-disable-next-line import/no-unresolved
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          exclude: ['**/e2e/**', '**/node_modules/**'],
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['**/e2e/**/*.test.ts'],
          fileParallelism: false,
          retry: 2,
        },
      },
    ],
  },
});
