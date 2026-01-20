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

beforeAll(async () => {
  if (process.env.CLEAN_E2E) {
    await rm(TEST_DIR, {recursive: true, force: true});
  }
  await mkdir(TEST_DIR, {recursive: true});
  browser = await puppeteer.launch({headless: true});
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

async function runCLI(
  projectName,
  language,
  framework,
  appType = 'todos',
  schemas = false,
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
      '--sync',
      'false',
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

  const consoleMessages = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  try {
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 45000});

    await sleep(1000);

    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body.textContent);

    expect(title).toContain('TinyBase');
    expect(bodyText).toContain('TinyBase');

    if (framework === 'react') {
      const hasReactRoot = await page.evaluate(() => {
        const app = document.getElementById('app');
        return app && app.children.length > 0;
      });
      expect(hasReactRoot).toBe(true);
    }

    if (framework === 'react') {
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
      await input.click();
      await page.type('input[type="text"]', 'Test todo item');

      await sleep(100);
      const inputValue = await page.evaluate(() => {
        const inp = document.querySelector('input[type="text"]');
        return inp ? inp.value : '';
      });

      if (inputValue !== 'Test todo item') {
        throw new Error(
          `Input value is "${inputValue}", expected "Test todo item"`,
        );
      }

      await page.keyboard.press('Enter');
      await sleep(1000);
      let todoExists = await page.evaluate(() => {
        const text = 'Test todo item';
        const allText = document.body.textContent;
        return allText.includes(text);
      });

      expect(todoExists).toBe(true);

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
      await sleep(500);

      const messages = await page.evaluate(() => document.body.textContent);
      expect(messages).toContain('Hello from e2e test!');
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
      await sleep(300);
      squares = await page.$$('button.square, button[class*="square"]');
      let square0Text = await squares[0].evaluate((el) => el.textContent);
      expect(square0Text).toBe('X');

      await squares[1].click();
      await sleep(300);
      squares = await page.$$('button.square, button[class*="square"]');
      let square1Text = await squares[1].evaluate((el) => el.textContent);
      expect(square1Text).toBe('O');

      squares = await page.$$('button.square, button[class*="square"]');
      await squares[3].click();
      await sleep(300);

      squares = await page.$$('button.square, button[class*="square"]');
      await squares[4].click();
      await sleep(300);

      squares = await page.$$('button.square, button[class*="square"]');
      await squares[6].click();
      await sleep(300);

      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toMatch(/won|wins|winner/i);
    }

    const realErrors = consoleErrors.filter(
      (err) =>
        !err.includes('ERR_NETWORK_CHANGED') &&
        !err.includes('ERR_NAME_NOT_RESOLVED') &&
        !err.includes('Failed to load resource') &&
        !err.includes('WebSocket'),
    );
    if (realErrors.length > 0) {
      throw new Error(`Console errors: ${realErrors.join(', ')}`);
    }

    if (pageErrors.length > 0) {
      throw new Error(`Page errors: ${pageErrors.join(', ')}`);
    }
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

describe('e2e tests', {concurrent: true}, () => {
  combinations.forEach((combo, index) => {
    it(
      `should create and run ${combo.name} app`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const projectPath = join(TEST_DIR, projectName);
        const clientPath = join(projectPath, 'client');
        const port = BASE_PORT + index;

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
          combo.language,
          combo.framework,
          combo.appType,
          combo.schemas,
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

        // Run TypeScript check for TypeScript projects
        if (combo.language === 'typescript') {
          const tsResult = await runTypeScriptCheck(projectPath);
          if (!tsResult.passed) {
            throw new Error(
              `TypeScript check failed for ${combo.name}:\n${tsResult.errors}`,
            );
          }
        }

        // Run ESLint check
        const eslintResult = await runESLintCheck(projectPath);
        if (!eslintResult.passed) {
          throw new Error(
            `ESLint check failed for ${combo.name}:\n${eslintResult.errors}`,
          );
        }

        // Run Prettier check
        const prettierResult = await runPrettierCheck(projectPath);
        if (!prettierResult.passed) {
          throw new Error(
            `Prettier check failed for ${combo.name}:\n${prettierResult.errors}`,
          );
        }

        let devServer;
        try {
          devServer = await startDevServer(projectPath, port);

          await sleep(1500);

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
