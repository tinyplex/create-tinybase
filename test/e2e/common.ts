import {spawn} from 'child_process';
import {existsSync} from 'fs';
import {cp, mkdir, readFile, rename, rm} from 'fs/promises';
import {dirname, join} from 'path';
import puppeteer, {Browser, ConsoleMessage, Page} from 'puppeteer';
import {fileURLToPath} from 'url';
import {expect} from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const TEST_DIR = join(__dirname, '..', '..', 'tmp');
export const BASE_PORT = 5173;

export let browser: Browser;

export async function initBrowser() {
  if (process.env.CLEAN_E2E) {
    await rm(TEST_DIR, {recursive: true, force: true});
  }
  await mkdir(TEST_DIR, {recursive: true});
  browser = await puppeteer.launch({headless: true});
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
  }
}

export async function runCLI(
  projectName: string,
  language: string,
  framework: string,
  appType = 'todos',
  schemas = false,
  syncType = 'none',
  persistenceType = 'local-storage',
) {
  return new Promise((resolve, reject) => {
    const args = [
      join(__dirname, '..', '..', 'dist', 'cli.js'),
      '--non-interactive',
      '--projectName',
      projectName,
      '--language',
      language,
      '--framework',
      framework,
      '--appType',
      appType,
      '--prettier',
      'true',
      '--eslint',
      'true',
      '--syncType',
      syncType,
      '--persistenceType',
      persistenceType,
    ];

    if (schemas) {
      args.push('--schemas', 'true');
    }

    const cli = spawn('node', args, {
      cwd: TEST_DIR,
      stdio: 'pipe',
    });

    let output = '';
    let errorOutput = '';

    cli.stdout?.on('data', (data) => {
      output += data.toString();
    });

    cli.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    cli.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `CLI exited with code ${code}\nOutput: ${output}\nError: ${errorOutput}`,
          ),
        );
      } else {
        resolve({output, errorOutput});
      }
    });

    cli.on('error', reject);
  });
}

export async function setupTestProject(
  projectName: string,
  language: string,
  framework: string,
  appType: string,
  schemas = false,
  syncType = 'none',
  persistenceType = 'local-storage',
) {
  const projectPath = join(TEST_DIR, projectName);
  const clientPath = join(projectPath, 'client');
  const nodeModulesBackup = join(TEST_DIR, `${projectName}-node_modules`);
  const nodeModulesPath = join(clientPath, 'node_modules');
  const cacheFile = join(clientPath, '.package.json.cache');

  if (existsSync(projectPath) && !process.env.CLEAN_E2E) {
    if (existsSync(nodeModulesPath)) {
      await rename(nodeModulesPath, nodeModulesBackup);
    }
    if (existsSync(cacheFile)) {
      await rename(cacheFile, join(TEST_DIR, `${projectName}.cache`));
    }
    await rm(projectPath, {recursive: true});
  }

  await runCLI(
    projectName,
    language,
    framework,
    appType,
    schemas,
    syncType,
    persistenceType,
  );

  if (existsSync(nodeModulesBackup)) {
    await mkdir(clientPath, {recursive: true});

    await rename(nodeModulesBackup, nodeModulesPath);
    const cachedFile = join(TEST_DIR, `${projectName}.cache`);
    if (existsSync(cachedFile)) {
      await rename(cachedFile, cacheFile);
    }
  }

  await npmInstall(projectPath, !!process.env.CLEAN_E2E);

  return {projectPath, clientPath};
}

async function npmInstall(projectPath: string, force = false) {
  const clientPath = join(projectPath, 'client');

  if (!force) {
    const nodeModulesPath = join(clientPath, 'node_modules');
    const packageJsonPath = join(clientPath, 'package.json');
    const cachedPackageJsonPath = join(clientPath, '.package.json.cache');

    if (existsSync(nodeModulesPath) && existsSync(cachedPackageJsonPath)) {
      try {
        const currentPackageJson = await readFile(packageJsonPath, 'utf-8');
        const cachedPackageJson = await readFile(
          cachedPackageJsonPath,
          'utf-8',
        );

        if (currentPackageJson === cachedPackageJson) {
          return {output: 'Reused existing node_modules', errorOutput: ''};
        }
      } catch (err) {}
    }
  }

  return new Promise((resolve, reject) => {
    const npm = spawn('npm', ['install'], {
      cwd: clientPath,
      stdio: 'pipe',
    });

    let output = '';
    let errorOutput = '';

    npm.stdout?.on('data', (data) => {
      output += data.toString();
    });

    npm.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    npm.on('close', async (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `npm install exited with code ${code}\nOutput: ${output}\nError: ${errorOutput}`,
          ),
        );
      } else {
        try {
          const packageJsonPath = join(clientPath, 'package.json');
          const cachedPackageJsonPath = join(clientPath, '.package.json.cache');
          await cp(packageJsonPath, cachedPackageJsonPath);
        } catch (err) {}
        resolve({output, errorOutput});
      }
    });

    npm.on('error', reject);
  });
}

export async function runTypeScriptCheck(projectPath: string) {
  const clientPath = join(projectPath, 'client');
  const tsconfigPath = join(clientPath, 'tsconfig.json');

  if (!existsSync(tsconfigPath)) {
    return {passed: true, output: 'No TypeScript config found, skipping'};
  }

  return new Promise((resolve, reject) => {
    const tsc = spawn('npx', ['tsc', '--noEmit'], {
      cwd: clientPath,
      stdio: 'pipe',
    });

    let output = '';
    let errorOutput = '';

    tsc.stdout?.on('data', (data) => {
      output += data.toString();
    });

    tsc.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    tsc.on('close', (code) => {
      if (code !== 0) {
        resolve({
          passed: false,
          output,
          errorOutput,
          errors: errorOutput + output,
        });
      } else {
        resolve({passed: true, output, errorOutput});
      }
    });

    tsc.on('error', reject);
  });
}

export async function runESLintCheck(projectPath: string) {
  const clientPath = join(projectPath, 'client');

  return new Promise((resolve, reject) => {
    const eslint = spawn('npm', ['run', 'lint'], {
      cwd: clientPath,
      stdio: 'pipe',
    });

    let output = '';
    let errorOutput = '';

    eslint.stdout?.on('data', (data) => {
      output += data.toString();
    });

    eslint.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    eslint.on('close', (code) => {
      if (code !== 0) {
        resolve({
          passed: false,
          output,
          errorOutput,
          errors: errorOutput + output,
        });
      } else {
        resolve({passed: true, output, errorOutput});
      }
    });

    eslint.on('error', reject);
  });
}

export async function runPrettierCheck(projectPath: string) {
  const clientPath = join(projectPath, 'client');

  return new Promise((resolve, reject) => {
    const prettier = spawn('npm', ['run', 'format:check'], {
      cwd: clientPath,
      stdio: 'pipe',
    });

    let output = '';
    let errorOutput = '';

    prettier.stdout?.on('data', (data) => {
      output += data.toString();
    });

    prettier.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    prettier.on('close', (code) => {
      if (code !== 0) {
        resolve({
          passed: false,
          output,
          errorOutput,
          errors: errorOutput + output,
        });
      } else {
        resolve({passed: true, output, errorOutput});
      }
    });

    prettier.on('error', reject);
  });
}

export async function startDevServer(projectPath: string, port: number) {
  const clientPath = join(projectPath, 'client');

  return new Promise((resolve, reject) => {
    const dev = spawn('npm', ['run', 'dev', '--', '--port', port.toString()], {
      cwd: clientPath,
      stdio: 'pipe',
      env: {...process.env, PORT: port.toString()},
    });

    let output = '';
    let isReady = false;

    const onData = (data: Buffer) => {
      output += data.toString();
      if (
        (output.includes('Local:') || output.includes('localhost')) &&
        output.includes('ready in')
      ) {
        if (!isReady) {
          isReady = true;
          setTimeout(() => resolve(dev), 500);
        }
      }
    };

    dev.stdout?.on('data', onData);
    dev.stderr?.on('data', onData);

    dev.on('error', reject);

    setTimeout(() => {
      if (!isReady) {
        reject(
          new Error(`Dev server did not start in time. Output: ${output}`),
        );
      }
    }, 60000);
  });
}

export function killProcess(proc: any) {
  return new Promise<void>((resolve) => {
    if (!proc || proc.killed) {
      resolve();
      return;
    }

    proc.on('close', resolve);
    proc.kill('SIGTERM');

    setTimeout(() => {
      if (!proc.killed) {
        proc.kill('SIGKILL');
      }
      resolve();
    }, 5000);
  });
}

export function setupPageErrorHandling(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg: ConsoleMessage) => {
    const type = msg.type();
    const text = msg.text();
    // console[type](text);

    if (type === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', (error) => {
    const message = error instanceof Error ? error.message : String(error);
    pageErrors.push(message);
  });

  return {
    checkErrors: () => {
      if (consoleErrors.length > 0) {
        throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
      }
      if (pageErrors.length > 0) {
        throw new Error(`Page errors: ${pageErrors.join(', ')}`);
      }
    },
  };
}

export async function waitForTextInPage(page: Page, text: string) {
  return page.waitForFunction(
    (searchText: string) =>
      document.querySelector('body')!.innerText.includes(searchText),
    {},
    text,
  );
}

export async function testBasicApp(
  port: number,
  framework: string,
  appType: string,
  testFunction: (page: Page) => Promise<void>,
) {
  const url = `http://localhost:${port}`;
  const page = await browser.newPage();

  const {checkErrors} = setupPageErrorHandling(page);

  try {
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => !document.getElementById('loading'));

    expect(await page.title()).toContain('TinyBase');
    await waitForTextInPage(page, 'TinyBase');

    if (framework === 'react') {
      await page.waitForFunction(() => {
        const app = document.getElementById('app');
        return app && app.children.length > 0;
      });

      const screenshotPath = join(
        __dirname,
        '..',
        '..',
        'screenshots',
        `${appType}.png`,
      );
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
      });
    }

    await testFunction(page);

    checkErrors();
  } finally {
    await page.close();
  }
}
