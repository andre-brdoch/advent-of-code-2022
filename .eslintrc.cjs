module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'brace-style': [2, 'stroustrup'],
    indent: [2, 2, { VariableDeclarator: 2 }],
    'no-console': 0,
    'no-var': 2,
    'prefer-const': 2,
    '@typescript-eslint/no-unused-vars': 2,
  },
}
