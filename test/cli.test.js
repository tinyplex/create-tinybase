import {spawn} from 'child_process';
import {mkdir, readdir, readFile, rm} from 'fs/promises';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DIR = join(__dirname, '.test-output');

const combinations = [
  {language: 'javascript', framework: 'vanilla', name: 'js-vanilla'},
  {language: 'javascript', framework: 'react', name: 'js-react'},
  {language: 'typescript', framework: 'vanilla', name: 'ts-vanilla'},
  {language: 'typescript', framework: 'react', name: 'ts-react'},
];

async function runCLI(projectName, language, framework) {
  return runCLIWithOptions(projectName, language, framework, false, false);
}

async function runCLIWithOptions(
  projectName,
  language,
  framework,
  prettier,
  eslint,
) {
  return new Promise((resolve, reject) => {
    const cli = spawn(
      'node',
      [
        join(__dirname, '..', 'dist', 'cli.js'),
        '--non-interactive',
        '--project-name',
        projectName,
        '--language',
        language,
        '--framework',
        framework,
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
    cli.stdout.on('data', (data) => (output += data.toString()));
    cli.stderr.on('data', (data) => (errorOutput += data.toString()));

    cli.on('close', (code) => {
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

    cli.on('error', (error) => {
      reject(error);
    });
  });
}

async function getFileList(dir, relativePath = '') {
  const files = [];
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
        await runCLI(projectName, combo.language, combo.framework);
      }, 10000);

      it('should have correct package.json', async () => {
        const pkgPath = join(projectPath, 'package.json');
        const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));

        expect(pkg.name).toBe(projectName);
        expect(pkg.dependencies.tinybase).toBeDefined();
        expect(pkg.scripts.dev).toBeDefined();
        expect(pkg.scripts.build).toBeDefined();

        if (combo.framework === 'react') {
          expect(pkg.dependencies.react).toBeDefined();
          expect(pkg.dependencies['react-dom']).toBeDefined();
        }
      });

      it('should have correct file structure', async () => {
        const files = await getFileList(projectPath);

        expect(files).toContain('package.json');
        expect(files).toContain('index.html');
        expect(files).toContain('README.md');

        const srcFiles = files.filter((f) => f.startsWith('src/'));
        expect(srcFiles.length).toBeGreaterThan(0);

        if (combo.language === 'typescript') {
          expect(files).toContain('tsconfig.json');
        }

        if (combo.framework === 'react') {
          expect(files).toContain('vite.config.js');
        }
      });

      it('should have valid source files', async () => {
        const files = await getFileList(projectPath);
        const srcFiles = files.filter(
          (f) => f.startsWith('src/') && !f.endsWith('.css'),
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
        const snapshot = {};

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
      await runCLIWithOptions(projectName, 'typescript', 'react', true, true);
      const files = await getFileList(projectPath);

      expect(files).toContain('.prettierrc');
      expect(files).toContain('eslint.config.js');
      expect(files).toContain('package.json');

      // Check package.json has the right dependencies and scripts
      const pkg = JSON.parse(
        await readFile(join(projectPath, 'package.json'), 'utf-8'),
      );
      expect(pkg.devDependencies).toHaveProperty('prettier');
      expect(pkg.devDependencies).toHaveProperty('eslint');
      expect(pkg.devDependencies).toHaveProperty('typescript-eslint');
      expect(pkg.devDependencies).toHaveProperty('eslint-plugin-react');
      expect(pkg.scripts).toHaveProperty('format');
      expect(pkg.scripts).toHaveProperty('lint');

      // Check eslint config has correct imports
      const eslintConfig = await readFile(
        join(projectPath, 'eslint.config.js'),
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
