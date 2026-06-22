import {mkdir} from 'fs/promises';
import {dirname, join} from 'path';
import {Page} from 'puppeteer';
import {fileURLToPath} from 'url';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  BASE_PORT,
  HOST,
  browser,
  closeBrowser,
  initBrowser,
  killProcess,
  runESLintCheck,
  runPrettierCheck,
  runTypeScriptCheck,
  setupPageErrorHandling,
  setupTestProject,
  sleepForPersistence,
  startDevServer,
  waitForTextInPage,
} from './common.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const combinations = [
  {
    language: 'javascript',
    framework: 'react',
    appType: 'charting',
    name: 'js-react-charting',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'charting',
    name: 'ts-react-charting',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'charting',
    name: 'ts-react-charting-schemas',
    schemas: true,
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'charting',
    name: 'ts-react-charting-tinywidgets',
    tinyWidgets: true,
  },
];

const persistenceCombinations = [
  {
    language: 'typescript',
    framework: 'react',
    appType: 'charting',
    persistenceType: 'sqlite',
    name: 'ts-react-charting-persist-sqlite',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'charting',
    persistenceType: 'pglite',
    name: 'ts-react-charting-persist-pglite',
  },
];

const syncCombinations = [
  {
    language: 'typescript',
    framework: 'react',
    appType: 'charting',
    name: 'ts-react-charting-sync',
  },
];

const firstRevenueInputSelector =
  '.chartingSheet tbody tr:first-child td:nth-child(2) input';
const firstExpensesInputSelector =
  '.chartingSheet tbody tr:first-child td:nth-child(3) input';

async function waitForChartingApp(page: Page) {
  await page.waitForFunction(() => !document.getElementById('loading'));
  await page.waitForSelector('.chartingChart .points circle');
}

async function waitForInputValue(page: Page, selector: string, value: string) {
  await page.waitForFunction(
    (selector, value) => {
      const input = document.querySelector(selector) as HTMLInputElement | null;
      return input?.value === value;
    },
    {},
    selector,
    value,
  );
}

async function setInputValue(page: Page, selector: string, value: string) {
  const input = await page.waitForSelector(selector);
  await input!.click({count: 3});
  await page.keyboard.type(value);
  await waitForInputValue(page, selector, value);
}

async function testChartingApp(page: Page) {
  await page.waitForSelector('.chartingChart .points circle');

  const summary = await page.evaluate(() => ({
    chartPoints: document.querySelectorAll('.chartingChart .points circle')
      .length,
    inputs: document.querySelectorAll('.chartingSheet input').length,
    rows: document.querySelectorAll('.chartingSheet tbody tr').length,
  }));

  expect(summary.chartPoints).toBe(12);
  expect(summary.inputs).toBe(18);
  expect(summary.rows).toBe(6);

  await setInputValue(page, firstRevenueInputSelector, '14000');
}

async function testChartingPersistence(page: Page, persistenceType: string) {
  await setInputValue(page, firstRevenueInputSelector, '6000');

  await sleepForPersistence(persistenceType);
  await page.reload({waitUntil: 'domcontentloaded'});
  await waitForChartingApp(page);

  await waitForInputValue(page, firstRevenueInputSelector, '6000');
}

async function testChartingSync(page1: Page, page2: Page) {
  await page1.bringToFront();
  await setInputValue(page1, firstRevenueInputSelector, '6000');

  await page2.bringToFront();
  await waitForInputValue(page2, firstRevenueInputSelector, '6000');

  await setInputValue(page2, firstExpensesInputSelector, '5000');

  await page1.bringToFront();
  await waitForInputValue(page1, firstExpensesInputSelector, '5000');
}

async function testBasicChartingApp(
  port: number,
  testFunction: (page: Page) => Promise<void>,
  screenshotName: string,
) {
  const url = `http://${HOST}:${port}`;
  const page = await browser.newPage();

  const {checkErrors} = setupPageErrorHandling(page);

  try {
    await page.evaluateOnNewDocument(() => {
      Math.random = () => 0.5;
    });
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    await waitForChartingApp(page);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );

    expect(await page.title()).toContain('TinyBase');
    await waitForTextInPage(page, 'TinyBase');

    const screenshotDir = join(__dirname, '..', '..', 'screenshots', 'e2e');
    await mkdir(screenshotDir, {recursive: true});
    await page.screenshot({
      path: join(screenshotDir, `${screenshotName}.png`),
      fullPage: false,
    });

    await testFunction(page);

    checkErrors();
  } finally {
    await page.close();
  }
}

beforeAll(async () => {
  await initBrowser();
}, 60000);

afterAll(async () => {
  await closeBrowser();
});

describe('charting e2e tests', {concurrent: false}, () => {
  combinations.forEach((combo, index) => {
    test(
      `should create and run ${combo.name} app`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 700 + index;

        const {projectPath} = await setupTestProject(
          projectName,
          combo.language,
          combo.framework,
          combo.appType,
          combo.schemas,
          'none',
          'local-storage',
          combo.tinyWidgets,
        );

        if (combo.language === 'typescript') {
          const tsResult = (await runTypeScriptCheck(projectPath)) as any;
          if (!tsResult.passed) {
            throw new Error(
              `TypeScript check failed for ${combo.name}:\n${tsResult.errors}`,
            );
          }
        }

        const eslintResult = (await runESLintCheck(projectPath)) as any;
        if (!eslintResult.passed) {
          throw new Error(
            `ESLint check failed for ${combo.name}:\n${eslintResult.errors}`,
          );
        }

        const prettierResult = (await runPrettierCheck(projectPath)) as any;
        if (!prettierResult.passed) {
          throw new Error(
            `Prettier check failed for ${combo.name}:\n${prettierResult.errors}`,
          );
        }

        let devServer;
        try {
          devServer = await startDevServer(projectPath, port);

          await testBasicChartingApp(port, testChartingApp, combo.name);
        } finally {
          if (devServer) {
            await killProcess(devServer);
          }
        }
      },
    );
  });
});

describe('charting persistence e2e tests', () => {
  persistenceCombinations.forEach((combo, index) => {
    test(
      `should persist data with ${combo.persistenceType} in ${combo.name}`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 800 + index;

        const {projectPath} = await setupTestProject(
          projectName,
          combo.language,
          combo.framework,
          combo.appType,
          false,
          'none',
          combo.persistenceType,
        );

        const tsResult = (await runTypeScriptCheck(projectPath)) as any;
        if (!tsResult.passed) {
          throw new Error(
            `TypeScript check failed for ${combo.name}:\n${tsResult.errors}`,
          );
        }

        let devServer;
        try {
          devServer = await startDevServer(projectPath, port);

          const url = `http://${HOST}:${port}`;
          const page = await browser.newPage();

          const {checkErrors} = setupPageErrorHandling(page);

          try {
            await page.goto(url, {waitUntil: 'domcontentloaded'});
            await waitForChartingApp(page);

            expect(await page.title()).toContain('TinyBase');

            await testChartingPersistence(page, combo.persistenceType);

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

describe('charting sync e2e tests', () => {
  syncCombinations.forEach((combo, index) => {
    test(
      `should sync ${combo.name} between two windows`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 810 + index;

        const {projectPath} = await setupTestProject(
          projectName,
          combo.language,
          combo.framework,
          combo.appType,
          false,
          'remote',
        );

        const tsResult = (await runTypeScriptCheck(projectPath)) as any;
        if (!tsResult.passed) {
          throw new Error(
            `TypeScript check failed for ${combo.name}:\n${tsResult.errors}`,
          );
        }

        let devServer;
        try {
          devServer = await startDevServer(projectPath, port);

          const uniqueId = `test${Math.random().toString(36).substring(2, 8)}`;
          const url = `http://${HOST}:${port}/${uniqueId}`;

          const page1 = await browser.newPage();
          const page2 = await browser.newPage();

          const errorHandler1 = setupPageErrorHandling(page1);
          const errorHandler2 = setupPageErrorHandling(page2);

          try {
            await page1.goto(url, {waitUntil: 'domcontentloaded'});
            await page2.goto(url, {waitUntil: 'domcontentloaded'});

            await waitForChartingApp(page1);
            await waitForChartingApp(page2);

            expect(await page1.title()).toContain('TinyBase');
            expect(await page2.title()).toContain('TinyBase');
            await waitForTextInPage(page1, 'TinyBase');
            await waitForTextInPage(page2, 'TinyBase');

            await testChartingSync(page1, page2);

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
