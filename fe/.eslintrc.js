module.exports = {
  root: true,
  overrides: [
    {
      env: {
        browser: true,
        es2021: true,
      },
      files: ['*.ts'],
      extends: ['airbnb-typescript/base', 'prettier'],
      plugins: ['prettier'],
      parserOptions: {
        project: ['tsconfig.*?.json', 'e2e/tsconfig.json'],
        createDefaultProgram: true,
      },
      rules: {
        '@typescript-eslint/lines-between-class-members': 'off',
        'arrow-body-style': 'off',
        'class-methods-use-this': 'off',
        'func-names': 'off',
        'import/extensions': 'off',
        'import/no-unresolved': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/prefer-default-export': 'off',
        'lines-between-class-members': 'off',
        'no-param-reassign': 'off',
        'max-len': [
          'error',
          {
            code: 120,
            ignoreComments: true,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
          },
        ],
        'no-console': 'off',
        'no-empty-function': ['warn', { allow: ['constructors'] }],
        'no-process-exit': 'off',
        'no-unused-vars': 'warn',
        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        'object-curly-newline': 'off',
        'object-shorthand': 'off',
        'operator-linebreak': 'off',
        'prettier/prettier': 'error',
      },
    },
    {
      files: ['index.html', '*.component.html'],
      extends: ['plugin:@angular-eslint/template/recommended'],
      rules: {
        'max-len': ['warn', { code: 120, ignoreComments: true, ignoreUrls: true }],
      },
    },
    {
      files: ['*.component.ts'],
      extends: ['plugin:@angular-eslint/template/process-inline-templates'],
    },
    {
      files: ['src/**/*.spec.js'], // Or *.test.js
      rules: {
        'require-jsdoc': 'off',
      },
    },
  ],
};
