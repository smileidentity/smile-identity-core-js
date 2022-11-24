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
    'no-console': ['error', {
      allow: ['warn', 'error', 'info'],
    }],
  },
};
