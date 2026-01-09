#!/usr/bin/env node
import {dirname, join} from 'path';
import {createCLI} from 'tinycreate';
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
      validate: (value: string) =>
        value.length > 0 ? true : 'Project name is required',
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
      type: 'confirm' as const,
      name: 'prettier',
      message: 'Include Prettier?',
      initial: false,
    },
    {
      type: 'confirm' as const,
      name: 'eslint',
      message: 'Include ESLint?',
      initial: false,
    },
  ],

  createContext: (answers: Record<string, unknown>) => {
    const {projectName, language, framework, prettier, eslint} = answers;
    const typescript = language === 'typescript';
    const react = framework === 'react';
    const ext = typescript ? (react ? 'tsx' : 'ts') : react ? 'jsx' : 'js';

    return {
      projectName,
      language,
      framework,
      prettier,
      eslint,
      typescript,
      react,
      ext,
    };
  },

  createDirectories: async (targetDir: string) => {
    const {mkdir} = await import('fs/promises');
    const {join} = await import('path');
    await mkdir(join(targetDir, 'src'), {recursive: true});
    await mkdir(join(targetDir, 'public'), {recursive: true});
  },

  getFiles: (context: Record<string, unknown>) => {
    const {typescript, react, ext, prettier, eslint} = context;

    const files = [
      {
        template: 'base/package.json.hbs',
        output: 'package.json',
        prettier: true,
      },
      {
        template: 'base/index.html.hbs',
        output: 'index.html',
        prettier: true,
      },
      {
        template: 'base/README.md.hbs',
        output: 'README.md',
        prettier: true,
      },
      {
        template: 'src/index.css.hbs',
        output: 'src/index.css',
        prettier: true,
      },
      {
        template: 'src/index.tsx.hbs',
        output: `src/index.${ext}`,
        prettier: true,
        transpile: true,
      },
    ];

    if (prettier) {
      files.push({
        template: 'base/.prettierrc.hbs',
        output: '.prettierrc',
        prettier: true,
      });
    }

    if (eslint) {
      files.push({
        template: 'base/eslint.config.js.hbs',
        output: 'eslint.config.js',
        prettier: true,
      });
    }

    if (react) {
      files.push(
        {
          template: 'src/App.tsx.hbs',
          output: `src/App.${ext}`,
          prettier: true,
          transpile: true,
        },
        {
          template: 'base/vite.config.js.hbs',
          output: 'vite.config.js',
          prettier: true,
        },
      );
    }

    if (typescript) {
      files.push(
        {
          template: 'base/tsconfig.json.hbs',
          output: 'tsconfig.json',
          prettier: true,
        },
        {
          template: 'base/tsconfig.node.json.hbs',
          output: 'tsconfig.node.json',
          prettier: true,
        },
      );
    }

    return files;
  },

  templateRoot: join(__dirname, 'templates'),

  onSuccess: (projectName: string) => {
    console.log(`Next steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  npm install`);
    console.log(`  npm run dev`);
  },
};

createCLI(config).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
