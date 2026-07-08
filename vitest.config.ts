import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // Unit tests cover the pure core (src/**) only; e2e lives under tests/e2e
    // and is driven by Playwright, never Vitest.
    include: ['tests/unit/**/*.spec.ts'],
    environment: 'node',
  },
});
