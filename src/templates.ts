import {mkdir, writeFile} from 'fs/promises';
import {join} from 'path';

type Language = 'typescript' | 'javascript';
type Framework = 'react' | 'vanilla';

interface ProjectConfig {
  projectName: string;
  language: Language;
  framework: Framework;
}

const getExtension = (language: Language, framework: Framework): string => {
  if (language === 'typescript') {
    return framework === 'react' ? 'tsx' : 'ts';
  }
  return framework === 'react' ? 'jsx' : 'js';
};

export const generateProject = async (
  targetDir: string,
  config: ProjectConfig,
): Promise<void> => {
  const {projectName, language, framework} = config;
  const isTypescript = language === 'typescript';
  const isReact = framework === 'react';
  const ext = getExtension(language, framework);

  // Create directory structure
  await mkdir(join(targetDir, 'src'), {recursive: true});
  await mkdir(join(targetDir, 'public'), {recursive: true});

  // Generate package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    scripts: {
      dev: 'vite',
      build: isTypescript ? 'tsc && vite build' : 'vite build',
      preview: 'vite preview',
    },
    devDependencies: {
      vite: '^7.1.3',
      ...(isTypescript && {
        typescript: '^5.9.3',
        '@types/node': '^25.0.3',
      }),
      ...(isReact &&
        isTypescript && {
          '@types/react': '^18.3.18',
          '@types/react-dom': '^18.3.5',
        }),
      ...(isReact && {
        '@vitejs/plugin-react': '^4.3.4',
      }),
    },
    dependencies: {
      tinybase: '^6.6.0',
      ...(isReact && {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
      }),
    },
  };

  await writeFile(
    join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  );

  // Generate index.html
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TinyBase</title>
  </head>
  <body>
    ${isReact ? '<div id="app"></div>' : ''}
    <script type="module" src="/src/index.${ext}"></script>
  </body>
</html>
`;

  await writeFile(join(targetDir, 'index.html'), indexHtml);

  // Generate main source file
  if (isReact) {
    await generateReactApp(targetDir, isTypescript, ext);
  } else {
    await generateVanillaApp(targetDir, isTypescript, ext);
  }

  // Generate CSS
  const indexCss = `body {
  font-family: system-ui;
  padding: 2rem;
}
`;

  await writeFile(join(targetDir, 'src', 'index.css'), indexCss);

  // Generate TypeScript config if needed
  if (isTypescript) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        module: 'ESNext',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: 'force',
        noEmit: true,
        ...(isReact && {jsx: 'react-jsx'}),
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedSideEffectImports: true,
      },
      include: ['src'],
    };

    await writeFile(
      join(targetDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2),
    );

    const tsConfigNode = {
      compilerOptions: {
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
      },
    };

    await writeFile(
      join(targetDir, 'tsconfig.node.json'),
      JSON.stringify(tsConfigNode, null, 2),
    );
  }

  // Generate vite config if React
  if (isReact) {
    const viteConfig = `import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react()],
});
`;

    await writeFile(join(targetDir, 'vite.config.js'), viteConfig);
  }

  // Generate .prettierrc
  const prettierrc = {
    bracketSpacing: false,
    singleQuote: true,
    trailingComma: 'all',
  };

  await writeFile(
    join(targetDir, '.prettierrc'),
    JSON.stringify(prettierrc, null, 2),
  );

  // Generate README.md
  const readme = `# ${projectName}

A TinyBase app built with ${isTypescript ? 'TypeScript' : 'JavaScript'} and ${isReact ? 'React' : 'Vanilla JS'}.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Learn More

- [TinyBase Documentation](https://tinybase.org)
- [TinyBase Examples](https://tinybase.org/demos/)
`;

  await writeFile(join(targetDir, 'README.md'), readme);
};

const generateVanillaApp = async (
  targetDir: string,
  isTypescript: boolean,
  ext: string,
): Promise<void> => {
  const indexFile = `import './index.css';
import {createStore} from 'tinybase';

// Convenience function for attaching an action to a button
const onClick = (id${isTypescript ? ': string' : ''}, onClick${isTypescript ? ': () => void' : ''}) =>
  document.getElementById(id)${isTypescript ? '!' : ''}.addEventListener('click', onClick);

// Convenience function for writing out pretty JSON into an element
const updateJson = (id${isTypescript ? ': string' : ''}, content${isTypescript ? ': unknown' : ''}) =>
  (document.getElementById(id)${isTypescript ? '!' : ''}.innerText = JSON.stringify(content, null, 2));

// Convenience function for generating a random integer
const getRandom = (max = 100) => Math.floor(Math.random() * max);

addEventListener('load', () => {
  // Create the TinyBase Store
  const store = createStore();

  // Attach events to the buttons to mutate the data in the TinyBase Store
  onClick('countButton', () => store.setValue('counter', (value) => value + 1));
  onClick('randomButton', () => store.setValue('random', getRandom()));
  onClick('addPetButton', () =>
    store.addRow('pets', {
      name: ['fido', 'felix', 'bubbles', 'lowly', 'polly'][getRandom(5)],
      species: store.getRowIds('species')[getRandom(5)],
    }),
  );

  // Bind listeners to all Values and Tables in the Store to print the content
  store.addValuesListener(() => updateJson('valuesJson', store.getValues()));
  store.addTablesListener(() => updateJson('tablesJson', store.getTables()));

  // Initialize the Store's data
  store
    .setValue('counter', 0)
    .setRow('pets', '0', {name: 'fido', species: 'dog'})
    .setTable('species', {
      dog: {price: 5},
      cat: {price: 4},
      fish: {price: 2},
      worm: {price: 1},
      parrot: {price: 3},
    });
});
`;

  await writeFile(join(targetDir, 'src', `index.${ext}`), indexFile);
};

const generateReactApp = async (
  targetDir: string,
  isTypescript: boolean,
  ext: string,
): Promise<void> => {
  const indexFile = `import './index.css';
import ReactDOM from 'react-dom/client';
import {App} from './App';

addEventListener('load', () =>
  ReactDOM.createRoot(document.getElementById('app')${isTypescript ? '!' : ''}).render(<App />),
);
`;

  await writeFile(join(targetDir, 'src', `index.${ext}`), indexFile);

  const appFile = `import {createStore} from 'tinybase';
import {Provider, useValue} from 'tinybase/ui-react';

const store = createStore().setValue('count', 0);

export const App = () => (
  <Provider store={store}>
    <h1>TinyBase + React</h1>
    <Counter />
  </Provider>
);

const Counter = () => {
  const count = useValue('count', store);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => store.setValue('count', (c${isTypescript ? ': number' : ''}) => c + 1)}>
        Increment
      </button>
    </div>
  );
};
`;

  await writeFile(join(targetDir, 'src', `App.${ext}`), appFile);
};
