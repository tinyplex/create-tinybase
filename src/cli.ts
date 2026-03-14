#!/usr/bin/env node
import {existsSync} from 'fs';
import {dirname, join} from 'path';
import {
  createCLI,
  detectPackageManager,
  type FileConfig,
  type TemplateContext,
} from 'tinycreate';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = {
  welcomeMessage: '🎉 Welcome to TinyBase!\n',

  questions: [
    {
      type: 'text' as const,
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-tinybase-app',
      validate: (value: string) => {
        if (value.length === 0) {
          return 'Project name is required';
        }
        const targetPath = join(process.cwd(), value);
        if (existsSync(targetPath)) {
          return `Directory "${
            value
          }" already exists. Please choose a different name.`;
        }
        return true;
      },
    },
    {
      type: 'select' as const,
      name: 'appType',
      message: 'App type:',
      choices: [
        {title: 'Todo app', value: 'todos'},
        {title: 'Chat app', value: 'chat'},
        {title: 'Drawing app', value: 'drawing'},
        {title: 'Tic-tac-toe game', value: 'game'},
      ],
      initial: 0,
    },
    {
      type: 'select' as const,
      name: 'language',
      message: 'Language:',
      choices: [
        {title: 'TypeScript', value: 'typescript'},
        {title: 'JavaScript', value: 'javascript'},
      ],
      initial: 0,
    },
    {
      type: 'select' as const,
      name: 'framework',
      message: 'Framework:',
      choices: [
        {title: 'React', value: 'react'},
        {title: 'Vanilla', value: 'vanilla'},
        {title: 'Svelte (Todo app only)', value: 'svelte'},
      ],
      initial: 0,
    },
    {
      type: (prev: unknown, answers: Record<string, unknown>) =>
        answers.language === 'typescript' ? ('confirm' as const) : null,
      name: 'schemas',
      message: 'Include store schemas?',
      initial: false,
    },
    {
      type: 'select' as const,
      name: 'syncType',
      message: 'Synchronization:',
      choices: [
        {title: 'None', value: 'none'},
        {title: 'Via remote demo server (stateless)', value: 'remote'},
        {title: 'Via local node server (stateless)', value: 'node'},
        {
          title: 'Via local DurableObjects server (stateful)',
          value: 'durable-objects',
        },
      ],
      initial: 1,
    },
    {
      type: 'select' as const,
      name: 'persistenceType',
      message: 'Persistence:',
      choices: [
        {title: 'None', value: 'none'},
        {title: 'Local Storage', value: 'local-storage'},
        {title: 'SQLite', value: 'sqlite'},
        {title: 'PGlite', value: 'pglite'},
      ],
      initial: 1,
    },
    {
      type: 'confirm' as const,
      name: 'prettier',
      message: 'Include Prettier?',
      initial: true,
    },
    {
      type: 'confirm' as const,
      name: 'eslint',
      message: 'Include ESLint?',
      initial: true,
    },
    {
      type: (prev: unknown, answers: Record<string, unknown>) =>
        answers.syncType !== 'node' && answers.syncType !== 'durable-objects'
          ? ('confirm' as const)
          : null,
      name: 'installAndRun',
      message: 'Install dependencies and start dev server?',
      initial: true,
    },
  ],

  createContext: (answers: Record<string, unknown>) => {
    const {
      projectName,
      language,
      framework,
      appType,
      prettier,
      eslint,
      schemas,
      syncType,
      persistenceType,
      installAndRun,
    } = answers;
    const typescript = language === 'typescript';
    const javascript = !typescript;
    if (framework === 'svelte' && appType !== 'todos') {
      throw new Error(
        'Svelte support is currently available only for the Todo app',
      );
    }
    const react = framework === 'react';
    const vanilla = framework === 'vanilla';
    const svelte = framework === 'svelte';
    const scriptExt = typescript ? 'ts' : 'js';
    const componentExt = svelte
      ? 'svelte'
      : typescript
        ? react
          ? 'tsx'
          : 'ts'
        : react
          ? 'jsx'
          : 'js';
    const entryExt = svelte ? scriptExt : componentExt;
    const normalizedSyncType = syncType || 'remote';
    const sync = normalizedSyncType !== 'none';
    const server =
      normalizedSyncType === 'node' || normalizedSyncType === 'durable-objects';
    const serverType =
      normalizedSyncType === 'durable-objects' ? 'durable-objects' : 'node';
    const isDurableObject = normalizedSyncType === 'durable-objects';
    const normalizedPersistenceType = persistenceType || 'local-storage';
    const persist = normalizedPersistenceType !== 'none';
    const persistLocalStorage = normalizedPersistenceType === 'local-storage';
    const persistSqlite = normalizedPersistenceType === 'sqlite';
    const persistPglite = normalizedPersistenceType === 'pglite';
    const needsViteConfig = react || svelte || persistSqlite || persistPglite;
    const appSurface =
      appType === 'chat'
        ? 'chat interface'
        : appType === 'drawing'
          ? 'drawing canvas'
          : appType === 'game'
            ? 'game'
            : 'todo list';
    const frameworkName = react ? 'React' : vanilla ? 'Vanilla JS' : 'Svelte';
    const clientFrameworkDescription = react
      ? 'React-based'
      : vanilla
        ? 'vanilla JavaScript'
        : 'Svelte-based';
    const entryFileDescription = react
      ? 'Entry point that bootstraps and renders the React app'
      : svelte
        ? 'Entry point that bootstraps and mounts the Svelte app'
        : 'Entry point that bootstraps the app';
    const appFileStem = vanilla ? 'app' : 'App';
    const appFileExt = vanilla ? scriptExt : componentExt;
    const appFileDescription = react
      ? `Main React component that renders the ${appSurface}`
      : vanilla
        ? 'Main application logic'
        : `Main Svelte component that renders the ${appSurface}`;
    const primaryStoreStem = react
      ? appType === 'chat'
        ? 'ChatStore'
        : appType === 'drawing'
          ? 'CanvasStore'
          : 'Store'
      : appType === 'chat'
        ? 'chatStore'
        : appType === 'drawing'
          ? 'canvasStore'
          : 'store';
    const primaryStoreExt = react ? componentExt : scriptExt;
    const primaryStoreDescription = `TinyBase ${
      appType === 'chat'
        ? 'chat messages'
        : appType === 'drawing'
          ? 'drawing canvas'
          : 'main'
    } store configuration`;
    const needsSettingsStore = appType === 'chat' || appType === 'drawing';
    const settingsStoreStem = react ? 'SettingsStore' : 'settingsStore';
    const settingsStoreExt = react ? componentExt : scriptExt;
    const configExt = react ? componentExt : scriptExt;

    return {
      projectName,
      language,
      framework,
      appType,
      prettier,
      eslint,
      schemas: typescript && (schemas === true || schemas === 'true'),
      syncType: normalizedSyncType,
      sync,
      server,
      serverType,
      isDurableObject,
      persistenceType: normalizedPersistenceType,
      persist,
      persistLocalStorage,
      persistSqlite,
      persistPglite,
      needsViteConfig,
      frameworkName,
      clientFrameworkDescription,
      entryFileDescription,
      appFileStem,
      appFileExt,
      appFileDescription,
      primaryStoreStem,
      primaryStoreExt,
      primaryStoreDescription,
      needsSettingsStore,
      settingsStoreStem,
      settingsStoreExt,
      configExt,
      installAndRun: installAndRun === true || installAndRun === 'true',
      typescript,
      javascript,
      react,
      vanilla,
      svelte,
      scriptExt,
      componentExt,
      entryExt,
      ext: entryExt,
    };
  },

  createDirectories: async (
    targetDir: string,
    context: Record<string, unknown>,
  ) => {
    const {mkdir} = await import('fs/promises');
    const {join} = await import('path');
    const server = context.server as boolean;

    await mkdir(join(targetDir, 'client/src'), {recursive: true});
    await mkdir(join(targetDir, 'client/public'), {recursive: true});

    if (server) {
      await mkdir(join(targetDir, 'server'), {recursive: true});
    }
  },

  getFiles: () => [
    {
      template: 'README.md.hbs',
      output: 'README.md',
      prettier: true,
    },
  ],

  processIncludedFile: (file: FileConfig, context: TemplateContext) => {
    const {javascript} = context;

    const prettier =
      file.prettier ?? /\.(js|jsx|ts|tsx|css|json|html|md)$/.test(file.output);
    const transpile =
      file.transpile ??
      (/\.(ts|tsx)\.hbs$/.test(file.template) && javascript === true);

    return {
      ...file,
      prettier,
      transpile,
    };
  },

  templateRoot: join(__dirname, 'templates'),

  installCommand: '{pm} install',
  devCommand: '{pm} run dev',
  workingDirectory: 'client',

  onSuccess: (projectName: string, context: Record<string, unknown>) => {
    const syncType = context.syncType as string;
    const server = syncType === 'node' || syncType === 'durable-objects';
    const pm = detectPackageManager();

    console.log(`Next steps:`);
    console.log();

    if (server) {
      console.log('To run the server:');
      console.log(`  cd ${projectName}/server`);
      console.log(`  ${pm} install`);
      console.log(`  ${pm} run dev`);
      console.log();
    }

    console.log('To run the client:');
    console.log(`  cd ${projectName}/client`);
    console.log(`  ${pm} install`);
    console.log(`  ${pm} run dev`);
  },
};

createCLI(config).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
