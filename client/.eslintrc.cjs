// @ts-check

/** @type {import("eslint").ESLint.ConfigData} */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', "import"],
  rules: {
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    'sort-imports': 0,
    'import/order': [
      2,
      {
        'alphabetize': {
          'order': 'asc'
        }
      }
    ]
  },
};
