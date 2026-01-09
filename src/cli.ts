#!/usr/bin/env node
import {dirname, join} from 'path';
import {createCLI} from 'tinycreate';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

type Language = 'typescript' | 'javascript';
type Framework = 'react' | 'vanilla';

interface TinyBaseAnswers {
  projectName: string;
  language: Language;
  framework: Framework;
  prettier: boolean;
  eslint: boolean;
}

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

  createContext: (answers: TinyBaseAnswers) => {
    const isTypescript = answers.language === 'typescript';
    const isReact = answers.framework === 'react';
    const ext = isTypescript
      ? isReact
        ? 'tsx'
        : 'ts'
      : isReact
        ? 'jsx'
        : 'js';

    return {
      ...answers,
      isTypescript,
      isReact,
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
    const {isTypescript, isReact, ext, prettier, eslint} = context;

    const files = [
      {template: 'base/package.template.json', output: 'package.json'},
      {
        template: 'base/index.template.html',
        output: 'index.html',
        prettier: true,
      },
      {
        template: 'base/README.template.md',
        output: 'README.md',
        prettier: true,
      },
      {
        template: 'src/index.template.css',
        output: 'src/index.css',
        prettier: true,
      },
      {
        template: 'src/index.template.tsx',
        output: `src/index.${ext}`,
        prettier: true,
        transpile: true,
      },
    ];

    if (prettier) {
      files.push({
        template: 'base/.prettierrc.template',
        output: '.prettierrc',
      });
    }

    if (eslint) {
      files.push({
        template: 'base/eslint.config.template.js',
        output: 'eslint.config.js',
        prettier: true,
      });
    }

    if (isReact) {
      files.push(
        {
          template: 'src/App.template.tsx',
          output: `src/App.${ext}`,
          prettier: true,
          transpile: true,
        },
        {
          template: 'base/vite.config.template.js',
          output: 'vite.config.js',
          prettier: true,
        },
      );
    }

    if (isTypescript) {
      files.push(
        {template: 'base/tsconfig.template.json', output: 'tsconfig.json'},
        {
          template: 'base/tsconfig.node.template.json',
          output: 'tsconfig.node.json',
        },
      );
    }

    return files;
  },

  templateRoot: join(__dirname, '../templates'),

  onSuccess: (projectName: string) => {
    console.log(`Next steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  npm install`);
    console.log(`  npm run dev`);
  },
};

createCLI(config).catch((error) => {
  console.error(error);
  process.exit(1);
});
