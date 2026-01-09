import {mkdir} from 'fs/promises';
import {join} from 'path';
import prompts from 'prompts';
import {generateProject} from './templates.js';

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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
