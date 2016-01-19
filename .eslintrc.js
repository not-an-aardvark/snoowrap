module.exports = {
  parser: "babel-eslint",
  rules: {
    indent: [2, 2],
    quotes: [2, 'single'],
    'linebreak-style': [2, 'unix'],
    semi: [2, 'always'],
    'no-trailing-spaces': 2,
    'no-console': 1
  },
  env: {
    es6: true,
    node: true
  },
  extends: 'eslint:recommended',
  globals: {
    Proxy: true
  }
};
