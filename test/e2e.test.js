import {spawn} from 'child_process';
import {existsSync} from 'fs';
import {cp, mkdir, readFile, rm} from 'fs/promises';
import {dirname, join} from 'path';
import puppeteer from 'puppeteer';
import {setTimeout as sleep} from 'timers/promises';
import {fileURLToPath} from 'url';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DIR = join(__dirname, '..', 'tmp');
const BASE_PORT = 5173;

let browser;

const combinations = [
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'todos',
    name: 'js-vanilla-todos',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'todos',
    name: 'js-react-todos',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'todos',
    name: 'ts-vanilla-todos',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'todos',
    name: 'ts-react-todos',
  },
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'chat',
    name: 'js-vanilla-chat',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'chat',
    name: 'js-react-chat',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'chat',
    name: 'ts-vanilla-chat',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'chat',
    name: 'ts-react-chat',
  },
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'drawing',
    name: 'js-vanilla-drawing',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'drawing',
    name: 'js-react-drawing',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'drawing',
    name: 'ts-vanilla-drawing',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'drawing',
    name: 'ts-react-drawing',
  },
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'game',
    name: 'js-vanilla-game',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'game',
    name: 'js-react-game',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'game',
    name: 'ts-vanilla-game',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'game',
    name: 'ts-react-game',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'todos',
    name: 'ts-vanilla-todos-schemas',
    schemas: true,
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'todos',
    name: 'ts-react-todos-schemas',
    schemas: true,
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'chat',
    name: 'ts-vanilla-chat-schemas',
    schemas: true,
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'chat',
    name: 'ts-react-chat-schemas',
    schemas: true,
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'drawing',
    name: 'ts-vanilla-drawing-schemas',
    schemas: true,
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'drawing',
    name: 'ts-react-drawing-schemas',
    schemas: true,
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'game',
    name: 'ts-vanilla-game-schemas',
    schemas: true,
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'game',
    name: 'ts-react-game-schemas',
    schemas: true,
  },
];

async function runCLI(
  projectName,
  language,
  framework,
  appType = 'todos',
  schemas = false,
  syncType = 'none',
  persistenceType = 'local-storage',
) {
  return new Promise((resolve, reject) => {
    const args = [
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

async function setupTestProject(
  projectName,
  language,
  framework,
  appType,
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
      await cp(nodeModulesPath, nodeModulesBackup, {recursive: true});
    }
    if (existsSync(cacheFile)) {
      await cp(cacheFile, join(TEST_DIR, `${projectName}.cache`));
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
    const {mkdir} = await import('fs/promises');
    await mkdir(clientPath, {recursive: true});

    await cp(nodeModulesBackup, nodeModulesPath, {recursive: true});
    await rm(nodeModulesBackup, {recursive: true});
    const cachedFile = join(TEST_DIR, `${projectName}.cache`);
    if (existsSync(cachedFile)) {
      await cp(cachedFile, cacheFile);
      await rm(cachedFile);
    }
  }

  await npmInstall(projectPath, !!process.env.CLEAN_E2E);

  return {projectPath, clientPath};
}

async function npmInstall(projectPath, force = false) {
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
          console.log(`  ⚡ Reusing node_modules for ${clientPath}`);
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

async function runTypeScriptCheck(projectPath) {
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

async function runESLintCheck(projectPath) {
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

async function runPrettierCheck(projectPath) {
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

async function startDevServer(projectPath, port) {
  const clientPath = join(projectPath, 'client');

  return new Promise((resolve, reject) => {
    const dev = spawn('npm', ['run', 'dev', '--', '--port', port.toString()], {
      cwd: clientPath,
      stdio: 'pipe',
      env: {...process.env, PORT: port.toString()},
    });

    let output = '';
    let isReady = false;

    const onData = (data) => {
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

async function checkPageLoads(port, framework, appType) {
  const url = `http://localhost:${port}`;
  const page = await browser.newPage();

  const {checkErrors} = setupPageErrorHandling(page);

  try {
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 10000});

    await sleep(200);

    expect(await page.title()).toContain('TinyBase');
    await waitForTextInPage(page, 'TinyBase');

    if (framework === 'react') {
      const hasReactRoot = await page.evaluate(() => {
        const app = document.getElementById('app');
        return app && app.children.length > 0;
      });
      expect(hasReactRoot).toBe(true);

      const screenshotPath = join(
        __dirname,
        '..',
        'screenshots',
        `${appType}.png`,
      );
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
      });
    }

    if (appType === 'todos') {
      const input = await page.$('input[type="text"]');
      expect(input).toBeTruthy();
      await page.type('input[type="text"]', 'Test todo item');
      await sleep(200);

      const inputValue = await page.evaluate(() => {
        const inp = document.querySelector('input[type="text"]');
        return inp ? inp.value : '';
      });

      expect(inputValue).toBe('Test todo item');

      await page.keyboard.press('Enter');

      await waitForTextInPage(page, 'Test todo item');

      const checkbox = await page.$('input[type="checkbox"]');
      await checkbox.click();
      await sleep(200);

      const isChecked = await page.evaluate(() => {
        const cb = document.querySelector('input[type="checkbox"]');
        return cb ? cb.checked : false;
      });
      expect(isChecked).toBe(true);
    } else if (appType === 'chat') {
      const usernameInput = await page.$('input[placeholder*="name" i]');
      if (usernameInput) {
        await usernameInput.type('TestUser');
        await sleep(200);
      }

      const messageInput = await page.evaluateHandle(() => {
        const inputs = Array.from(
          document.querySelectorAll('input[type="text"]'),
        );
        return (
          inputs.find(
            (input) =>
              !input.placeholder.toLowerCase().includes('name') && !input.value,
          ) || inputs[inputs.length - 1]
        );
      });
      expect(messageInput).toBeTruthy();
      await messageInput.type('Hello from e2e test!');
      await page.keyboard.press('Enter');

      await waitForTextInPage(page, 'Hello from e2e test!');
    } else if (appType === 'drawing') {
      const canvas = await page.$('canvas');
      expect(canvas).toBeTruthy();

      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 150);
      await page.mouse.up();
      await sleep(200);

      const hasStrokes = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return imageData.data.some((value, index) => {
          if (index % 4 === 3) return false;
          return value > 20;
        });
      });
      expect(hasStrokes).toBe(true);
    } else if (appType === 'game') {
      let squares = await page.$$('button.square, button[class*="square"]');
      expect(squares.length).toBeGreaterThanOrEqual(9);

      await squares[0].click();
      await sleep(200);
      squares = await page.$$('button.square, button[class*="square"]');
      let square0Text = await squares[0].evaluate((el) => el.textContent);
      expect(square0Text).toBe('X');

      await squares[1].click();
      await sleep(200);
      squares = await page.$$('button.square, button[class*="square"]');
      let square1Text = await squares[1].evaluate((el) => el.textContent);
      expect(square1Text).toBe('O');

      squares = await page.$$('button.square, button[class*="square"]');
      await squares[3].click();
      await sleep(200);

      squares = await page.$$('button.square, button[class*="square"]');
      await squares[4].click();
      await sleep(200);

      squares = await page.$$('button.square, button[class*="square"]');
      await squares[6].click();
      await sleep(200);

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toMatch(/won|wins|winner/i);
    }

    checkErrors();
  } finally {
    await page.close();
  }
}

function killProcess(proc) {
  return new Promise((resolve) => {
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

function setupPageErrorHandling(page) {
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
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

async function waitForTextInPage(page, text, timeout = 5000) {
  return page.waitForFunction(
    (searchText) =>
      document.querySelector('body').innerText.includes(searchText),
    {timeout},
    text,
  );
}

beforeAll(async () => {
  if (process.env.CLEAN_E2E) {
    await rm(TEST_DIR, {recursive: true, force: true});
  }
  await mkdir(TEST_DIR, {recursive: true});
  browser = await puppeteer.launch({headless: true});
}, 60000);

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

describe('e2e tests', {concurrent: true}, () => {
  combinations.forEach((combo, index) => {
    it(
      `should create and run ${combo.name} app`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + index;

        const {projectPath} = await setupTestProject(
          projectName,
          combo.language,
          combo.framework,
          combo.appType,
          combo.schemas,
        );

        if (combo.language === 'typescript') {
          const tsResult = await runTypeScriptCheck(projectPath);
          if (!tsResult.passed) {
            throw new Error(
              `TypeScript check failed for ${combo.name}:\n${tsResult.errors}`,
            );
          }
        }

        const eslintResult = await runESLintCheck(projectPath);
        if (!eslintResult.passed) {
          throw new Error(
            `ESLint check failed for ${combo.name}:\n${eslintResult.errors}`,
          );
        }

        const prettierResult = await runPrettierCheck(projectPath);
        if (!prettierResult.passed) {
          throw new Error(
            `Prettier check failed for ${combo.name}:\n${prettierResult.errors}`,
          );
        }

        let devServer;
        try {
          devServer = await startDevServer(projectPath, port);

          await sleep(200);

          await checkPageLoads(port, combo.framework, combo.appType);
        } finally {
          if (devServer) {
            await killProcess(devServer);
          }
        }
      },
    );
  });
});

describe('persistence e2e tests', () => {
  const persistenceCombinations = [
    {
      language: 'typescript',
      framework: 'react',
      appType: 'todos',
      persistenceType: 'local-storage',
      name: 'ts-react-todos-persist-localstorage',
    },
    {
      language: 'typescript',
      framework: 'react',
      appType: 'todos',
      persistenceType: 'sqlite',
      name: 'ts-react-todos-persist-sqlite',
    },
    {
      language: 'typescript',
      framework: 'react',
      appType: 'todos',
      persistenceType: 'pglite',
      name: 'ts-react-todos-persist-pglite',
    },
    {
      language: 'javascript',
      framework: 'vanilla',
      appType: 'chat',
      persistenceType: 'local-storage',
      name: 'js-vanilla-chat-persist-localstorage',
    },
  ];

  persistenceCombinations.forEach((combo, index) => {
    it(
      `should persist data with ${combo.persistenceType} in ${combo.name}`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + combinations.length + index + 10;

        const {projectPath} = await setupTestProject(
          projectName,
          combo.language,
          combo.framework,
          combo.appType,
          false,
          'none',
          combo.persistenceType,
        );

        let devServer;
        try {
          devServer = await startDevServer(projectPath, port);

          await sleep(200);

          const url = `http://localhost:${port}`;
          const page = await browser.newPage();

          const {checkErrors} = setupPageErrorHandling(page);

          try {
            // Initial page load
            await page.goto(url, {
              waitUntil: 'domcontentloaded',
              timeout: 10000,
            });

            await sleep(1000); // Extra time for persister initialization

            expect(await page.title()).toContain('TinyBase');
            await waitForTextInPage(page, 'TinyBase');

            if (combo.appType === 'todos') {
              // Add a todo item
              const testTodo = `Persisted todo ${combo.persistenceType}`;
              await page.type('input[type="text"]', testTodo);
              await page.keyboard.press('Enter');
              await waitForTextInPage(page, testTodo);

              // Give persistence time to save
              await sleep(300);

              // Reload the page
              await page.reload({waitUntil: 'domcontentloaded'});
              await sleep(500);

              // Verify the todo is still there after reload
              // SQLite and PGLite take longer to initialize
              const timeout =
                combo.persistenceType === 'local-storage' ? 5000 : 10000;
              await waitForTextInPage(page, testTodo, timeout);

              // Check the todo by clicking checkbox
              const checkbox = await page.$('input[type="checkbox"]');
              await checkbox.click();
              await sleep(300);

              // Reload again
              await page.reload({waitUntil: 'domcontentloaded'});
              await sleep(500);

              // Verify checkbox state persisted
              const isChecked = await page.evaluate(() => {
                const cb = document.querySelector('input[type="checkbox"]');
                return cb ? cb.checked : false;
              });
              expect(isChecked).toBe(true);
            } else if (combo.appType === 'chat') {
              // Set username
              const usernameInput = await page.$(
                'input[placeholder*="name" i]',
              );
              if (usernameInput) {
                await usernameInput.click({clickCount: 3});
                await usernameInput.type('PersistUser');
                await sleep(300);
              }

              // Send a message
              const messageInput = await page.evaluateHandle(() => {
                const inputs = Array.from(
                  document.querySelectorAll('input[type="text"]'),
                );
                return (
                  inputs.find(
                    (input) =>
                      !input.placeholder.toLowerCase().includes('name') &&
                      !input.value,
                  ) || inputs[inputs.length - 1]
                );
              });
              const testMessage = `Persisted message ${combo.persistenceType}`;
              await messageInput.type(testMessage);
              await page.keyboard.press('Enter');
              await waitForTextInPage(page, testMessage);

              // Give persistence time to save
              await sleep(300);

              // Reload the page
              await page.reload({waitUntil: 'domcontentloaded'});
              await sleep(500);

              // Verify the message and username are still there
              await waitForTextInPage(page, testMessage);
              await waitForTextInPage(page, 'PersistUser');
            }

            checkErrors();
          } finally {
            await page.close();
          }
        } finally {
          if (devServer) {
            await killProcess(devServer);
          }
        }
      },
    );
  });
});

describe('sync e2e tests', () => {
  const syncCombinations = [
    {
      language: 'javascript',
      framework: 'vanilla',
      appType: 'todos',
      name: 'js-vanilla-todos-sync',
    },
    {
      language: 'javascript',
      framework: 'react',
      appType: 'todos',
      name: 'js-react-todos-sync',
    },
  ];

  syncCombinations.forEach((combo, index) => {
    it(
      `should sync ${combo.name} between two windows`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + combinations.length + index;

        const {projectPath} = await setupTestProject(
          projectName,
          combo.language,
          combo.framework,
          combo.appType,
          false,
          'remote',
        );

        let devServer;
        try {
          devServer = await startDevServer(projectPath, port);

          await sleep(200);

          const uniqueId = `test${Math.random().toString(36).substring(2, 8)}`;
          const url = `http://localhost:${port}/${uniqueId}`;

          const page1 = await browser.newPage();
          const page2 = await browser.newPage();

          const errorHandler1 = setupPageErrorHandling(page1);
          const errorHandler2 = setupPageErrorHandling(page2);

          try {
            await page1.goto(url, {
              waitUntil: 'domcontentloaded',
              timeout: 10000,
            });
            await page2.goto(url, {
              waitUntil: 'domcontentloaded',
              timeout: 10000,
            });

            await sleep(200);

            expect(await page1.title()).toContain('TinyBase');
            expect(await page2.title()).toContain('TinyBase');
            await waitForTextInPage(page1, 'TinyBase');
            await waitForTextInPage(page2, 'TinyBase');

            await page1.bringToFront();
            await page1.type('input[type="text"]', 'Synced todo item');
            await page1.keyboard.press('Enter');
            await waitForTextInPage(page1, 'Synced todo item');

            await page2.bringToFront();
            await waitForTextInPage(page2, 'Synced todo item');
            await page2.click('input[type="checkbox"]');
            await page2.waitForFunction(
              () => {
                const cb = document.querySelector('input[type="checkbox"]');
                return cb && cb.checked;
              },
              {timeout: 5000},
            );

            await page1.bringToFront();
            await page1.waitForFunction(
              () => {
                const cb = document.querySelector('input[type="checkbox"]');
                return cb && cb.checked;
              },
              {timeout: 5000},
            );

            errorHandler1.checkErrors();
            errorHandler2.checkErrors();
          } finally {
            await page1.close();
            await page2.close();
          }
        } finally {
          if (devServer) {
            await killProcess(devServer);
          }
        }
      },
    );
  });
});
