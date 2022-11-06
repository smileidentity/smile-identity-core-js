module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
    'jest/globals': true,
  },
  extends: [
    'airbnb-base',
    'plugin:jest/recommended',
    'plugin:jsdoc/recommended',
  ],
  parserOptions: {
    ecmaVersion: 13,
  },
  plugins: ['jest', 'jsdoc'],
  rules: {
    camelcase: 0,
    'compat/compat': 0,
    'max-nested-callbacks': 0,
    'no-console': ['error', {
      allow: ['warn', 'error', 'info'],
    }],
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'no-warning-comments': 0,
  },
};
