import {Buffer} from 'buffer';
import {ChildProcess, spawn} from 'child_process';
import {mkdir, readdir, readFile, rm} from 'fs/promises';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DIR = join(__dirname, '.test-output');

interface Combination {
  language: 'javascript' | 'typescript';
  framework: 'vanilla' | 'react' | 'svelte';
  appType: 'todos' | 'chat' | 'drawing' | 'game';
  syncType?: 'none' | 'remote' | 'node' | 'durable-objects';
  persistenceType?: 'none' | 'local-storage' | 'sqlite' | 'pglite';
  name: string;
}

const combinations: Combination[] = [
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'todos',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'js-vanilla-todos',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'todos',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'js-react-todos',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'todos',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'ts-vanilla-todos',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'todos',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'ts-react-todos',
  },
  {
    language: 'javascript',
    framework: 'svelte',
    appType: 'todos',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'js-svelte-todos',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'todos',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'ts-svelte-todos',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'todos',
    syncType: 'remote',
    persistenceType: 'local-storage',
    name: 'ts-svelte-todos-remote-sync',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'todos',
    syncType: 'none',
    persistenceType: 'sqlite',
    name: 'ts-svelte-todos-sqlite',
  },
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'chat',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'js-vanilla-chat',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'chat',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'js-react-chat',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'chat',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'ts-vanilla-chat',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'chat',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'ts-react-chat',
  },
  {
    language: 'javascript',
    framework: 'svelte',
    appType: 'chat',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'js-svelte-chat',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'chat',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'ts-svelte-chat',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'chat',
    syncType: 'none',
    persistenceType: 'sqlite',
    name: 'ts-svelte-chat-sqlite',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'chat',
    syncType: 'remote',
    persistenceType: 'local-storage',
    name: 'ts-svelte-chat-remote-sync',
  },
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'drawing',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'js-vanilla-drawing',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'drawing',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'js-react-drawing',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'drawing',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'ts-vanilla-drawing',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'drawing',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'ts-react-drawing',
  },
  {
    language: 'javascript',
    framework: 'svelte',
    appType: 'drawing',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'js-svelte-drawing',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'drawing',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'ts-svelte-drawing',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'drawing',
    syncType: 'none',
    persistenceType: 'sqlite',
    name: 'ts-svelte-drawing-sqlite',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'drawing',
    syncType: 'remote',
    persistenceType: 'local-storage',
    name: 'ts-svelte-drawing-remote-sync',
  },
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'game',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'js-vanilla-game',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'game',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'js-react-game',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'game',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'ts-vanilla-game',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'game',
    syncType: 'none',
    persistenceType: 'local-storage',
    name: 'ts-react-game',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'todos',
    syncType: 'remote',
    persistenceType: 'local-storage',
    name: 'ts-react-todos-remote-sync',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'chat',
    syncType: 'none',
    persistenceType: 'sqlite',
    name: 'js-react-chat-sqlite',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'game',
    syncType: 'none',
    persistenceType: 'pglite',
    name: 'ts-vanilla-game-pglite',
  },
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'drawing',
    syncType: 'none',
    persistenceType: 'none',
    name: 'js-vanilla-drawing-no-persist',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'chat',
    syncType: 'node',
    persistenceType: 'local-storage',
    name: 'ts-react-chat-node',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'todos',
    syncType: 'durable-objects',
    persistenceType: 'sqlite',
    name: 'js-react-todos-durable-objects',
  },
];

interface CLIResult {
  output: string;
  errorOutput: string;
}

type Language = 'javascript' | 'typescript';
type Framework = 'vanilla' | 'react' | 'svelte';
type AppType = 'todos' | 'chat' | 'drawing' | 'game';
type SyncType = 'none' | 'remote' | 'node' | 'durable-objects';
type PersistenceType = 'none' | 'local-storage' | 'sqlite' | 'pglite';

async function runCLI(
  projectName: string,
  language: Language,
  framework: Framework,
  appType: AppType = 'todos',
  syncType: SyncType = 'none',
  persistenceType: PersistenceType = 'local-storage',
): Promise<CLIResult> {
  return runCLIWithOptions(
    projectName,
    language,
    framework,
    appType,
    syncType,
    persistenceType,
    false,
    false,
  );
}

async function runCLIWithOptions(
  projectName: string,
  language: Language,
  framework: Framework,
  appType: AppType,
  syncType: SyncType,
  persistenceType: PersistenceType,
  prettier: boolean,
  eslint: boolean,
): Promise<CLIResult> {
  return new Promise((resolve, reject) => {
    const cli: ChildProcess = spawn(
      'node',
      [
        join(__dirname, '..', 'dist', 'cli.js'),
        '--non-interactive',
        '--projectName',
        projectName,
        '--language',
        language,
        '--framework',
        framework,
        '--appType',
        appType,
        '--syncType',
        syncType,
        '--persistenceType',
        persistenceType,
        '--prettier',
        prettier.toString(),
        '--eslint',
        eslint.toString(),
      ],
      {
        cwd: TEST_DIR,
        stdio: 'pipe',
      },
    );

    let output = '';
    let errorOutput = '';

    cli.stdout?.on('data', (data: Buffer) => (output += data.toString()));
    cli.stderr?.on('data', (data: Buffer) => (errorOutput += data.toString()));

    cli.on('close', (code: number | null) => {
      if (code === 0) {
        resolve({output, errorOutput});
      } else {
        reject(
          new Error(
            `CLI exited with code ${code}\nOutput: ${output}\nError: ${errorOutput}`,
          ),
        );
      }
    });

    cli.on('error', (error: Error) => {
      reject(error);
    });
  });
}

async function getFileList(
  dir: string,
  relativePath: string = '',
): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, {withFileTypes: true});

  for (const entry of entries) {
    const entryPath = join(dir, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...(await getFileList(entryPath, relPath)));
    } else {
      files.push(relPath);
    }
  }

  return files.sort();
}

interface PackageJson {
  name: string;
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts: Record<string, string>;
}

describe('create-tinybase', () => {
  beforeAll(async () => {
    await rm(TEST_DIR, {recursive: true, force: true});
    await mkdir(TEST_DIR, {recursive: true});
  });

  afterAll(async () => {
    await rm(TEST_DIR, {recursive: true, force: true});
  });

  for (const combo of combinations) {
    describe(`${combo.name}`, () => {
      const projectName = `test-${combo.name}`;
      const projectPath = join(TEST_DIR, projectName);

      it('should create project successfully', async () => {
        await runCLI(
          projectName,
          combo.language,
          combo.framework,
          combo.appType,
          combo.syncType || 'none',
          combo.persistenceType || 'local-storage',
        );
      }, 10000);

      it('should have correct package.json', async () => {
        const pkgPath = join(projectPath, 'client', 'package.json');
        const pkg: PackageJson = JSON.parse(await readFile(pkgPath, 'utf-8'));

        const hasServer =
          combo.syncType === 'node' || combo.syncType === 'durable-objects';
        const expectedName = hasServer ? `${projectName}-client` : projectName;
        expect(pkg.name).toBe(expectedName);
        expect(pkg.dependencies.tinybase).toBeDefined();
        expect(pkg.scripts.dev).toBeDefined();
        expect(pkg.scripts.build).toBeDefined();

        if (combo.framework === 'react') {
          expect(pkg.dependencies.react).toBeDefined();
          expect(pkg.dependencies['react-dom']).toBeDefined();
        }

        if (combo.framework === 'svelte') {
          expect(pkg.dependencies.tinybase).toBe('beta');
          expect(pkg.devDependencies?.svelte).toBeDefined();
          expect(
            pkg.devDependencies?.['@sveltejs/vite-plugin-svelte'],
          ).toBeDefined();
        }
      });

      it('should have correct file structure', async () => {
        const files = await getFileList(projectPath);

        expect(files).toContain('client/package.json');
        expect(files).toContain('client/index.html');
        expect(files).toContain('README.md');

        const srcFiles = files.filter((f: string) =>
          f.startsWith('client/src/'),
        );
        expect(srcFiles.length).toBeGreaterThan(0);

        if (combo.language === 'typescript') {
          expect(files).toContain('client/tsconfig.json');
        }

        if (combo.framework === 'react' || combo.framework === 'svelte') {
          expect(files).toContain('client/vite.config.js');
        }

        if (combo.framework === 'svelte') {
          expect(files).toContain('client/src/App.svelte');
        }
      });

      it('should have valid source files', async () => {
        const files = await getFileList(projectPath);
        const srcFiles = files.filter(
          (f: string) => f.startsWith('client/src/') && !f.endsWith('.css'),
        );

        expect(srcFiles.length).toBeGreaterThan(0);

        let hasTinybase = false;
        for (const file of srcFiles) {
          const content = await readFile(join(projectPath, file), 'utf-8');
          expect(content.length).toBeGreaterThan(0);
          if (content.includes('tinybase')) {
            hasTinybase = true;
          }
        }
        expect(hasTinybase).toBe(true);
      });

      it('should match snapshot', async () => {
        const files = await getFileList(projectPath);
        const snapshot: Record<string, string> = {};

        for (const file of files) {
          const content = await readFile(join(projectPath, file), 'utf-8');
          snapshot[file] = content;
        }

        expect(snapshot).toMatchSnapshot();
      });
    });
  }

  describe('with prettier and eslint', () => {
    const projectName = 'test-with-tools';
    const projectPath = join(TEST_DIR, projectName);

    it('should create project with prettier and eslint (ts-react)', async () => {
      await runCLIWithOptions(
        projectName,
        'typescript',
        'react',
        'todos',
        'none',
        'local-storage',
        true,
        true,
      );
      const files = await getFileList(projectPath);

      expect(files).toContain('client/.prettierrc.json');
      expect(files).toContain('client/eslint.config.js');
      expect(files).toContain('client/package.json');

      const pkg: PackageJson = JSON.parse(
        await readFile(join(projectPath, 'client', 'package.json'), 'utf-8'),
      );
      expect(pkg.devDependencies).toHaveProperty('prettier');
      expect(pkg.devDependencies).toHaveProperty('eslint');
      expect(pkg.devDependencies).toHaveProperty('typescript-eslint');
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-react');
      expect(pkg.scripts).toHaveProperty('format');
      expect(pkg.scripts).toHaveProperty('lint');

      const eslintConfig = await readFile(
        join(projectPath, 'client', 'eslint.config.js'),
        'utf-8',
      );
      expect(eslintConfig).toContain(
        "import tseslint from 'typescript-eslint'",
      );
      expect(eslintConfig).toContain(
        "import pluginReact from 'eslint-plugin-react'",
      );
    });
  });
});
