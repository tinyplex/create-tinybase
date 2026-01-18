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
];

beforeAll(async () => {
  // Only clean tmp if CLEAN_E2E env var is set
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

async function runCLI(projectName, language, framework, appType = 'todos') {
  return new Promise((resolve, reject) => {
    const cli = spawn(
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
        '--prettier',
        'false',
        '--eslint',
        'false',
        '--sync',
        'false',
      ],
      {
        cwd: TEST_DIR,
        stdio: 'pipe',
      },
    );

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
  // npm install needs to run in the client directory
  const clientPath = join(projectPath, 'client');

  // Check if we can skip npm install by reusing existing node_modules
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
      } catch (err) {
        // If comparison fails, proceed with install
      }
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
        // Cache the package.json for future comparisons
        try {
          const packageJsonPath = join(clientPath, 'package.json');
          const cachedPackageJsonPath = join(clientPath, '.package.json.cache');
          await cp(packageJsonPath, cachedPackageJsonPath);
        } catch (err) {
          // Ignore caching errors
        }
        resolve({output, errorOutput});
      }
    });

    npm.on('error', reject);
  });
}

async function startDevServer(projectPath, port) {
  // Dev server needs to run in the client directory
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

    // Take screenshot for README (only for React versions to have consistent styling)
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

    // App-specific functionality tests
    if (appType === 'todos') {
      // Add a todo
      const input = await page.$('input[type="text"]');
      expect(input).toBeTruthy();
      await input.click(); // Focus the input

      // Use page.type() which properly triggers React onChange events
      await page.type('input[type="text"]', 'Test todo item');

      await sleep(100); // Let React update

      // Verify text was entered
      const inputValue = await page.evaluate(() => {
        const inp = document.querySelector('input[type="text"]');
        return inp ? inp.value : '';
      });

      if (inputValue !== 'Test todo item') {
        throw new Error(
          `Input value is "${inputValue}", expected "Test todo item"`,
        );
      }

      // Submit the form (Enter key or button click)
      await page.keyboard.press('Enter');
      await sleep(1000); // Give time to update

      // Verify todo appears
      let todoExists = await page.evaluate(() => {
        const text = 'Test todo item';
        // Check various possible structures
        const allText = document.body.textContent;
        return allText.includes(text);
      });

      expect(todoExists).toBe(true);

      // Complete the todo
      const checkbox = await page.$('input[type="checkbox"]');
      await checkbox.click();
      await sleep(200);

      // Verify checkbox is checked
      const isChecked = await page.evaluate(() => {
        const cb = document.querySelector('input[type="checkbox"]');
        return cb ? cb.checked : false;
      });
      expect(isChecked).toBe(true);
    } else if (appType === 'chat') {
      // Set username
      const usernameInput = await page.$('input[placeholder*="name" i]');
      if (usernameInput) {
        await usernameInput.type('TestUser');
        await sleep(200);
      }

      // Send a message (find the message input, not the username input)
      const messageInput = await page.evaluateHandle(() => {
        const inputs = Array.from(
          document.querySelectorAll('input[type="text"]'),
        );
        // The message input is usually after the username input or has a specific placeholder
        return (
          inputs.find(
            (input) =>
              !input.placeholder.toLowerCase().includes('name') && !input.value, // Should be empty, unlike username which was filled
          ) || inputs[inputs.length - 1]
        ); // Fallback to last input
      });
      expect(messageInput).toBeTruthy();
      await messageInput.type('Hello from e2e test!');
      await page.keyboard.press('Enter');
      await sleep(500);

      // Verify message appears
      const messages = await page.evaluate(() => document.body.textContent);
      expect(messages).toContain('Hello from e2e test!');
    } else if (appType === 'drawing') {
      // Find canvas
      const canvas = await page.$('canvas');
      expect(canvas).toBeTruthy();

      // Draw on canvas
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 150);
      await page.mouse.up();
      await sleep(200);

      // Verify stroke data exists (check if canvas has been drawn on)
      const hasStrokes = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Check if any pixels are not the background color
        return imageData.data.some((value, index) => {
          // Skip alpha channel
          if (index % 4 === 3) return false;
          // Check if pixel is not black (background)
          return value > 20;
        });
      });
      expect(hasStrokes).toBe(true);
    } else if (appType === 'game') {
      // Play tic-tac-toe game
      let squares = await page.$$('button.square, button[class*="square"]');
      expect(squares.length).toBeGreaterThanOrEqual(9);

      // Make first move (X)
      await squares[0].click();
      await sleep(300);
      // Re-query to avoid stale references
      squares = await page.$$('button.square, button[class*="square"]');
      let square0Text = await squares[0].evaluate((el) => el.textContent);
      expect(square0Text).toBe('X');

      // Make second move (O)
      await squares[1].click();
      await sleep(300);
      // Re-query again
      squares = await page.$$('button.square, button[class*="square"]');
      let square1Text = await squares[1].evaluate((el) => el.textContent);
      expect(square1Text).toBe('O');

      // Make third move (X)
      squares = await page.$$('button.square, button[class*="square"]');
      await squares[3].click();
      await sleep(300);

      // Make fourth move (O)
      squares = await page.$$('button.square, button[class*="square"]');
      await squares[4].click();
      await sleep(300);

      // Make fifth move (X) - win condition: 0, 3, 6
      squares = await page.$$('button.square, button[class*="square"]');
      await squares[6].click();
      await sleep(300);

      // Verify win message appears
      const bodyText = await page.evaluate(() => document.body.textContent);
      expect(bodyText).toMatch(/won|wins|winner/i);
    }

    // Filter out network errors which are transient and not real errors
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

        // Preserve node_modules if it exists
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
          // Remove the project directory after backing up
          await rm(projectPath, {recursive: true});
        }

        await runCLI(
          projectName,
          combo.language,
          combo.framework,
          combo.appType,
        );

        // Restore node_modules if we backed it up
        if (existsSync(nodeModulesBackup)) {
          // Ensure client directory exists
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
