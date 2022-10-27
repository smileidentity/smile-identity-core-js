module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'plugin:jsdoc/recommended',
    'plugin:mocha/recommended',
    '@sinonjs/eslint-config',
  ],
  parserOptions: {
    ecmaVersion: 13,
  },
  plugins: ['jsdoc', 'mocha'],
  rules: {
    camelcase: 0,
    'compat/compat': 0,
    'max-nested-callbacks': 0,
    'no-console': ['error', {
      allow: ['warn', 'error', 'info'],
    }],
    'no-warning-comments': 0,
  },
};
