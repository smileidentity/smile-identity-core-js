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
  ],
  parserOptions: {
    ecmaVersion: 13,
  },
  plugins: ['jsdoc', 'mocha'],
  rules: {
    camelcase: 0,
    'compat/compat': 0,
    'max-nested-callbacks': 0,
    'mocha/no-mocha-arrows': 0,
    'no-console': ['error', {
      allow: ['warn', 'error', 'info'],
    }],
    // 'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'no-warning-comments': 0,
  },
};
