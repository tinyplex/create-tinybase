/// BEGIN typescript-config
/// addImport("import tseslint from 'typescript-eslint';");
  ...tseslint.configs.recommended,
/// END typescript-config

/// BEGIN javascript-config
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
/// END javascript-config

/// BEGIN react-config
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
/// END react-config
