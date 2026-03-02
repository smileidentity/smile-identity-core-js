import tseslint from 'typescript-eslint';
import jestPlugin from 'eslint-plugin-jest';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['coverage/**', 'dist/**'],
  },
  ...tseslint.configs.recommended,
  jsdocPlugin.configs['flat/recommended'],
  prettierPlugin,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        ...globals.node,
        ...globals.commonjs,
        ...globals.es2021,
        ...globals.jest,
      },
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      camelcase: 'off',
      'no-console': [
        'error',
        {
          allow: ['warn', 'error', 'info'],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/naming-convention': [
        // TODO: remove custom convention in future versions
        'warn',
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'snake_case', 'UPPER_CASE'],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.js', 'test/**'],
    ...jestPlugin.configs['flat/recommended'],
  },
);
