import jsLint from '@eslint/js';
import importLint from 'eslint-plugin-import';
import {globalIgnores} from 'eslint/config';
import globals from 'globals';
import tsLint from 'typescript-eslint';

export default tsLint.config(
  globalIgnores(['eslint.config.js', 'dist/**/*', 'test/**/*']),

  jsLint.configs.recommended,
  importLint.flatConfigs.recommended,
  tsLint.configs.recommended,

  {
    settings: {
      'import/resolver': {node: {extensions: ['.js', '.ts']}},
    },

    languageOptions: {globals: {...globals.node}},

    rules: {
      'no-var': 2,
      'no-console': 0,
      'object-curly-spacing': [2, 'never'],
      indent: 0,
      'no-empty': [2, {allowEmptyCatch: true}],
      'linebreak-style': [2, 'unix'],
      'space-infix-ops': 2,
      quotes: [2, 'single', {allowTemplateLiterals: true}],
      semi: [2, 'always'],
      'sort-keys': 0,
      'no-multiple-empty-lines': [2, {max: 1}],
      'sort-imports': 0,
      'max-len': [
        2,
        {
          code: 80,
          ignorePattern:
            '^(\\s+\\* )?(imports?|exports?|\\} from|(.+ as .+))\\W.*',
          ignoreUrls: true,
        },
      ],
      'comma-dangle': [
        2,
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'always-multiline',
        },
      ],
      'import/no-unresolved': [
        2,
        {
          ignore: ['eslint/config', 'typescript-eslint'],
        },
      ],

      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-unused-vars': [
        2,
        {argsIgnorePattern: '^_.*', varsIgnorePattern: '^_.*'},
      ],
    },
  },
);
