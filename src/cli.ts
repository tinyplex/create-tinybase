import {mkdir, writeFile} from 'fs/promises';
import {dirname, join} from 'path';
import prompts from 'prompts';
import {fileURLToPath} from 'url';
import {postProcessFile} from './postProcess.js';
import {TemplateEngine} from './templateEngine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const nonInteractive = args.includes('--non-interactive');

if (!nonInteractive) {
  console.log('🎉 Welcome to TinyBase!\n');
}

type Language = 'typescript' | 'javascript';
type Framework = 'react' | 'vanilla';

interface Answers {
  projectName: string;
  language: Language;
  framework: Framework;
}

const questions = [
  {
    type: 'text' as const,
    name: 'projectName' as const,
    message: 'Project name:',
    initial: 'my-tinybase-app',
    validate: (value: string) =>
      value.length > 0 ? true : 'Project name is required',
  },
  {
    type: 'select' as const,
    name: 'language' as const,
    message: 'Language:',
    choices: [
      {title: 'TypeScript', value: 'typescript' as Language},
      {title: 'JavaScript', value: 'javascript' as Language},
    ],
    initial: 0,
  },
  {
    type: 'select' as const,
    name: 'framework' as const,
    message: 'Framework:',
    choices: [
      {title: 'React', value: 'react' as Framework},
      {title: 'Vanilla', value: 'vanilla' as Framework},
    ],
    initial: 0,
  },
];

async function main() {
  let answers;

  if (nonInteractive) {
    const projectNameIndex = args.indexOf('--project-name');
    const languageIndex = args.indexOf('--language');
    const frameworkIndex = args.indexOf('--framework');

    answers = {
      projectName:
        projectNameIndex !== -1
          ? args[projectNameIndex + 1]
          : 'my-tinybase-app',
      language: languageIndex !== -1 ? args[languageIndex + 1] : 'typescript',
      framework: frameworkIndex !== -1 ? args[frameworkIndex + 1] : 'react',
    };
  } else {
    answers = await prompts(questions, {
      onCancel: () => {
        console.log('\n❌ Cancelled');
        process.exit(0);
      },
    });
  }

  if (!nonInteractive) {
    console.log(`\n📦 Creating your TinyBase app...\n`);
  }

  const projectPath = join(process.cwd(), answers.projectName);

  try {
    await mkdir(projectPath, {recursive: true});
    await generateProject(projectPath, answers);

    if (!nonInteractive) {
      console.log('✅ Done!\n');
      console.log(`Next steps:`);
      console.log(`  cd ${answers.projectName}`);
      console.log(`  npm install`);
      console.log(`  npm run dev`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error creating project:', errorMessage);
    process.exit(1);
  }
}

async function generateProject(
  targetDir: string,
  answers: Answers,
): Promise<void> {
  const isTypescript = answers.language === 'typescript';
  const isReact = answers.framework === 'react';
  const ext = isTypescript ? (isReact ? 'tsx' : 'ts') : isReact ? 'jsx' : 'js';

  const context = {
    projectName: answers.projectName,
    language: answers.language,
    framework: answers.framework,
    isTypescript,
    isReact,
    ext,
  };

  const engine = new TemplateEngine(context, join(__dirname, '../templates'));

  // Create directory structure
  await mkdir(join(targetDir, 'src'), {recursive: true});
  await mkdir(join(targetDir, 'public'), {recursive: true});

  // Process and write all template files
  const files: Array<{template: string; output: string; prettier?: boolean}> = [
    {template: 'base/package.template.json', output: 'package.json'},
    {
      template: 'base/index.template.html',
      output: 'index.html',
      prettier: true,
    },
    {template: 'base/README.template.md', output: 'README.md', prettier: true},
    {template: 'base/.prettierrc.template', output: '.prettierrc'},
    {
      template: 'src/index.template.css',
      output: 'src/index.css',
      prettier: true,
    },
    {
      template: 'src/index.template.tsx',
      output: `src/index.${ext}`,
      prettier: true,
    },
  ];

  if (isReact) {
    files.push(
      {
        template: 'src/App.template.tsx',
        output: `src/App.${ext}`,
        prettier: true,
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

  for (const {template, output, prettier = false} of files) {
    const processed = await engine.processTemplate(template);
    const {content, filePath} = await postProcessFile(output, processed, {
      prettier,
      transpileToJS: !isTypescript,
    });
    await writeFile(join(targetDir, filePath), content);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
