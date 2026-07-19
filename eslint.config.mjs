import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'test-results/**',
      'playwright-report/**',
      '.review/**',
    ],
  },
  js.configs.recommended,
  {
    // Type-checked rules for the TypeScript project proper (tsconfig.json's
    // `include`: src/, tests/). The three root *.config.ts files sit outside
    // that project and get the non-type-checked baseline below instead --
    // empirically, a synthetic single-file program cannot resolve
    // @playwright/test's ambient `process` typings correctly in isolation.
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['*.config.ts'],
    extends: [...tseslint.configs.recommended],
  },
  {
    files: ['tests/e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },
);
