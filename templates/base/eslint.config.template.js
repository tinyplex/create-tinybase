export default [
  /// IF context.isTypescript
  /// addImport("import tseslint from 'typescript-eslint';");
  ...tseslint.configs.recommended,
  /// ELSE
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
  /// ENDIF

  /// IF context.isReact
  /// addImport("import pluginReact from 'eslint-plugin-react';");
  /// addImport("import pluginReactHooks from 'eslint-plugin-react-hooks';");
  pluginReact.configs.flat.recommended,
  {
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  /// ENDIF
];
