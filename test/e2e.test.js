import {spawn} from 'child_process';
import {mkdir, rm} from 'fs/promises';
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
  {language: 'javascript', framework: 'vanilla', name: 'js-vanilla'},
  {language: 'javascript', framework: 'react', name: 'js-react'},
  {language: 'typescript', framework: 'vanilla', name: 'ts-vanilla'},
  {language: 'typescript', framework: 'react', name: 'ts-react'},
];

beforeAll(async () => {
  await rm(TEST_DIR, {recursive: true, force: true});
  await mkdir(TEST_DIR, {recursive: true});
  browser = await puppeteer.launch({headless: true});
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

async function runCLI(projectName, language, framework) {
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
        '--prettier',
        'false',
        '--eslint',
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

async function npmInstall(projectPath) {
  return new Promise((resolve, reject) => {
    const npm = spawn('npm', ['install'], {
      cwd: projectPath,
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

    npm.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `npm install exited with code ${code}\nOutput: ${output}\nError: ${errorOutput}`,
          ),
        );
      } else {
        resolve({output, errorOutput});
      }
    });

    npm.on('error', reject);
  });
}

async function startDevServer(projectPath, port) {
  return new Promise((resolve, reject) => {
    const dev = spawn('npm', ['run', 'dev', '--', '--port', port.toString()], {
      cwd: projectPath,
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
          setTimeout(() => resolve(dev), 2000);
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

async function checkPageLoads(port, framework) {
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
    await page.goto(url, {waitUntil: 'networkidle0', timeout: 30000});

    await sleep(2000);

    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body.textContent);
    const html = await page.content();

    // Title includes tech stack like "TinyBase / JavaScript" or "TinyBase / TypeScript + React"
    expect(title).toContain('TinyBase');
    expect(bodyText).toContain('TinyBase');

    if (framework === 'react') {
      const hasReactRoot = await page.evaluate(() => {
        const app = document.getElementById('app');
        return app && app.children.length > 0;
      });
      expect(hasReactRoot).toBe(true);

      const hasReactContent = await page.evaluate(() =>
        document.body.textContent.includes('TinyBase + React'),
      );
      expect(hasReactContent).toBe(true);
    }

    await page.evaluate(() => {
      const button = document.querySelector('button');
      if (button) {
        button.click();
      }
    });

    await sleep(500);

    if (consoleErrors.length > 0) {
      throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
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

describe('e2e tests', {concurrent: false}, () => {
  combinations.forEach((combo, index) => {
    it(
      `should create and run ${combo.name} app`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const projectPath = join(TEST_DIR, projectName);
        const port = BASE_PORT + index;

        await runCLI(projectName, combo.language, combo.framework);

        await npmInstall(projectPath);

        let devServer;
        try {
          devServer = await startDevServer(projectPath, port);

          await sleep(5000);

          await checkPageLoads(port, combo.framework);
        } finally {
          if (devServer) {
            await killProcess(devServer);
          }
        }
      },
    );
  });
});
