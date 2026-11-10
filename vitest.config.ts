import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
    // No tests exist until Phase 2 (T-07). Remove this line once the first test is added,
    // so a broken test glob fails loudly instead of passing silently.
    passWithNoTests: true,
  },
});
