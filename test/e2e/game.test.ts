import {Page} from 'puppeteer';
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
  sleepForPersistence,
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

const syncCombinations = [
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'game',
    name: 'js-vanilla-game-sync',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'game',
    name: 'js-react-game-sync',
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

  await sleepForPersistence(persistenceType);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !document.getElementById('loading'));

  const persistedState = await page.evaluate(() => {
    return document.body.textContent;
  });
  expect(persistedState.length).toBeGreaterThan(10);
}

async function testGameSync(page1: Page, page2: Page) {
  await page1.bringToFront();
  const gameElement = await page1.waitForSelector('#root, #app, main, body');
  const box = await gameElement!.boundingBox();
  await page1.mouse.click(box!.x + 100, box!.y + 100);

  const gameState = await page1.evaluate(() => {
    return document.body.textContent;
  });

  await page2.bringToFront();
  await page2.waitForFunction(
    (expectedState) => {
      return document.body.textContent === expectedState;
    },
    {},
    gameState,
  );

  const syncedState = await page2.evaluate(() => {
    return document.body.textContent;
  });
  expect(syncedState).toBe(gameState);
  expect(syncedState.length).toBeGreaterThan(10);
}

beforeAll(async () => {
  await initBrowser();
}, 60000);

afterAll(async () => {
  await closeBrowser();
});

describe('game e2e tests', {concurrent: false}, () => {
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

describe('game sync e2e tests', () => {
  syncCombinations.forEach((combo, index) => {
    test(
      `should sync ${combo.name} between two windows`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 500 + combinations.length + index;

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

          const uniqueId = `test${Math.random().toString(36).substring(2, 8)}`;
          const url = `http://localhost:${port}/${uniqueId}`;

          const page1 = await browser.newPage();
          const page2 = await browser.newPage();

          const errorHandler1 = setupPageErrorHandling(page1);
          const errorHandler2 = setupPageErrorHandling(page2);

          try {
            await page1.goto(url, {waitUntil: 'domcontentloaded'});
            await page2.goto(url, {waitUntil: 'domcontentloaded'});

            await page1.waitForFunction(
              () => !document.getElementById('loading'),
            );
            await page2.waitForFunction(
              () => !document.getElementById('loading'),
            );

            expect(await page1.title()).toContain('TinyBase');
            expect(await page2.title()).toContain('TinyBase');

            await testGameSync(page1, page2);

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
