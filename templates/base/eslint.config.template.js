/// context.isTypescript && addImport("import tseslint from 'typescript-eslint';");
/// context.isReact && addImport("import pluginReact from 'eslint-plugin-react';");
/// context.isReact && addImport("import pluginReactHooks from 'eslint-plugin-react-hooks';");
/// return 'export default [';
/// return context.isTypescript ? '  ...tseslint.configs.recommended,' : '  {\n    rules: {\n      \'no-unused-vars\': \'warn\',\n      \'no-undef\': \'error\',\n    },\n  },';
/// return context.isReact ? '  pluginReact.configs.flat.recommended,\n  {\n    plugins: {\n      \'react-hooks\': pluginReactHooks,\n    },\n    rules: {\n      ...pluginReactHooks.configs.recommended.rules,\n      \'react/react-in-jsx-scope\': \'off\',\n    },\n    settings: {\n      react: {\n        version: \'detect\',\n      },\n    },\n  },' : '';
/// return '];';
