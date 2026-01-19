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
      type: 'confirm' as const,
      name: 'sync',
      message: 'Enable synchronization?',
      initial: true,
    },
    {
      type: (prev: unknown, answers: Record<string, unknown>) =>
        answers.sync ? ('confirm' as const) : null,
      name: 'server',
      message: 'Add code for server?',
      initial: false,
    },
    {
      type: (prev: unknown, answers: Record<string, unknown>) =>
        answers.server ? ('select' as const) : null,
      name: 'serverType',
      message: 'Server type:',
      choices: [
        {title: 'Node', value: 'node'},
        {title: 'Durable Objects', value: 'durable-objects'},
      ],
      initial: 0,
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
        !answers.server ? ('confirm' as const) : null,
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
      sync,
      server,
      serverType,
      installAndRun,
    } = answers;
    const typescript = language === 'typescript';
    const javascript = !typescript;
    const react = framework === 'react';
    const ext = typescript ? (react ? 'tsx' : 'ts') : react ? 'jsx' : 'js';

    return {
      projectName,
      language,
      framework,
      appType,
      prettier,
      eslint,
      schemas: typescript && (schemas === true || schemas === 'true'),
      sync: sync === true || sync === 'true',
      server: server === true || server === 'true',
      serverType: serverType || 'node',
      installAndRun: installAndRun === true || installAndRun === 'true',
      typescript,
      javascript,
      react,
      ext,
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
    const server = context.server as boolean;
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
