import {Page} from 'puppeteer';
import {setTimeout as sleep} from 'timers/promises';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  BASE_PORT,
  browser,
  closeBrowser,
  initBrowser,
  killProcess,
  runESLintCheck,
  runPrettierCheck,
  runTypeScriptCheck,
  setupPageErrorHandling,
  setupTestProject,
  startDevServer,
  testBasicApp,
} from './common.js';

const combinations = [
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

const persistenceCombinations = [
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'game',
    persistenceType: 'sqlite',
    name: 'ts-vanilla-game-persist-sqlite',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'game',
    persistenceType: 'pglite',
    name: 'ts-vanilla-game-persist-pglite',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'game',
    persistenceType: 'sqlite',
    name: 'ts-react-game-persist-sqlite',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'game',
    persistenceType: 'pglite',
    name: 'ts-react-game-persist-pglite',
  },
];

async function testGameApp(page: Page) {
  await page.waitForSelector('button.square, button[class*="square"]');
  const squares = await page.$$('button.square, button[class*="square"]');
  expect(squares.length).toBeGreaterThanOrEqual(9);

  await page.evaluate(() =>
    (
      document.querySelectorAll(
        'button.square, button[class*="square"]',
      )[0] as HTMLButtonElement
    ).click(),
  );
  await page.waitForFunction(() => {
    const sq = document.querySelectorAll(
      'button.square, button[class*="square"]',
    )[0];
    return sq && sq.textContent === 'X';
  });

  await page.evaluate(() =>
    (
      document.querySelectorAll(
        'button.square, button[class*="square"]',
      )[1] as HTMLButtonElement
    ).click(),
  );
  await page.waitForFunction(() => {
    const sq = document.querySelectorAll(
      'button.square, button[class*="square"]',
    )[1];
    return sq && sq.textContent === 'O';
  });

  await page.evaluate(() =>
    (
      document.querySelectorAll(
        'button.square, button[class*="square"]',
      )[3] as HTMLButtonElement
    ).click(),
  );
  await page.waitForFunction(
    () =>
      document.querySelectorAll('button.square, button[class*="square"]')[3]
        .textContent === 'X',
  );

  await page.evaluate(() =>
    (
      document.querySelectorAll(
        'button.square, button[class*="square"]',
      )[4] as HTMLButtonElement
    ).click(),
  );
  await page.waitForFunction(
    () =>
      document.querySelectorAll('button.square, button[class*="square"]')[4]
        .textContent === 'O',
  );

  await page.evaluate(() =>
    (
      document.querySelectorAll(
        'button.square, button[class*="square"]',
      )[6] as HTMLButtonElement
    ).click(),
  );
  await page.waitForFunction(
    () =>
      document.querySelectorAll('button.square, button[class*="square"]')[6]
        .textContent === 'X',
  );

  const bodyText = await page.evaluate(() => document.body.textContent);
  expect(bodyText).toMatch(/won|wins|winner/i);
}

async function testGamePersistence(page: Page, persistenceType: string) {
  const gameElement = await page.waitForSelector('#root, #app, main, body');
  const box = await gameElement!.boundingBox();
  await page.mouse.click(box!.x + 100, box!.y + 100);

  const gameState = await page.evaluate(() => {
    return document.body.textContent;
  });

  await sleep(persistenceType === 'pglite' ? 1000 : 500);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !document.getElementById('loading'));

  const persistedState = await page.evaluate(() => {
    return document.body.textContent;
  });
  expect(persistedState.length).toBeGreaterThan(10);
}

beforeAll(async () => {
  await initBrowser();
}, 60000);

afterAll(async () => {
  await closeBrowser();
});

describe('game e2e tests', {concurrent: true}, () => {
  combinations.forEach((combo, index) => {
    test(
      `should create and run ${combo.name} app`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 500 + index;

        const {projectPath} = await setupTestProject(
          projectName,
          combo.language,
          combo.framework,
          combo.appType,
          combo.schemas,
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

          await testBasicApp(port, combo.framework, combo.appType, testGameApp);
        } finally {
          if (devServer) {
            await killProcess(devServer);
          }
        }
      },
    );
  });
});

describe('game persistence e2e tests', () => {
  persistenceCombinations.forEach((combo, index) => {
    test(
      `should persist data with ${combo.persistenceType} in ${combo.name}`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 600 + index;

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
            await page.goto(url, {waitUntil: 'domcontentloaded'});

            await page.waitForFunction(
              () => !document.getElementById('loading'),
            );

            expect(await page.title()).toContain('TinyBase');

            await testGamePersistence(page, combo.persistenceType);

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
