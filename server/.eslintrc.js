module.exports = {
    "env": {
        "es2021": true,
        "node": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "import"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
    ],
    "rules": {
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