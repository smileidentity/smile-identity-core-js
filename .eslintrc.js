module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
    'jest/globals': true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:jest/recommended',
    'plugin:jsdoc/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 13,
    project: './tsconfig.eslint.json',
  },
  plugins: ['jest', 'jsdoc', '@typescript-eslint'],
  ignorePatterns: ['coverage/**/*', 'dist/**/*'],
  rules: {
    camelcase: 0,
    'compat/compat': 0,
    'no-restricted-imports': 'off',
    'import/prefer-default-export': 'off',
    'no-console': ['error', {
      allow: ['warn', 'error', 'info'],
    }],
    '@typescript-eslint/naming-convention': [ // TODO:remove custom convention in future versions
      'warn',
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'snake_case', 'UPPER_CASE'],
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
};
