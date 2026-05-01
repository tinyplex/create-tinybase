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
  waitForTextInPage,
} from './common.js';

const combinations = [
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
    framework: 'svelte',
    appType: 'chat',
    name: 'js-svelte-chat',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'chat',
    name: 'ts-svelte-chat',
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
    name: 'ts-react-chat-tinywidgets',
    tinyWidgets: true,
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
    framework: 'svelte',
    appType: 'chat',
    name: 'ts-svelte-chat-schemas',
    schemas: true,
  },
];

const persistenceCombinations = [
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'chat',
    persistenceType: 'sqlite',
    name: 'ts-vanilla-chat-persist-sqlite',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'chat',
    persistenceType: 'pglite',
    name: 'ts-vanilla-chat-persist-pglite',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'chat',
    persistenceType: 'sqlite',
    name: 'ts-react-chat-persist-sqlite',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'chat',
    persistenceType: 'pglite',
    name: 'ts-react-chat-persist-pglite',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'chat',
    persistenceType: 'sqlite',
    name: 'ts-svelte-chat-persist-sqlite',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'chat',
    persistenceType: 'pglite',
    name: 'ts-svelte-chat-persist-pglite',
  },
];

const syncCombinations = [
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'chat',
    name: 'js-vanilla-chat-sync',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'chat',
    name: 'js-react-chat-sync',
  },
  {
    language: 'javascript',
    framework: 'svelte',
    appType: 'chat',
    name: 'js-svelte-chat-sync',
  },
];

async function testChatApp(page: Page) {
  const usernameInput = await page.waitForSelector(
    'input[placeholder*="name" i]',
  );
  await usernameInput!.type('TestUser');

  await page.waitForSelector('input[type="text"]:not([placeholder*="name" i])');
  await page.type(
    'input[type="text"]:not([placeholder*="name" i])',
    'Hello from e2e test!',
  );
  await page.keyboard.press('Enter');

  await waitForTextInPage(page, 'Hello from e2e test!');
}

async function testChatPersistence(page: Page, persistenceType: string) {
  const usernameInput = await page.waitForSelector(
    'input[placeholder*="name" i]',
  );
  await usernameInput!.click({clickCount: 3});
  await usernameInput!.type('PersistUser');

  await page.waitForSelector('input[type="text"]:not([placeholder*="name" i])');
  const testMessage = `Persisted message ${persistenceType}`;
  await page.type(
    'input[type="text"]:not([placeholder*="name" i])',
    testMessage,
  );
  await page.keyboard.press('Enter');
  await waitForTextInPage(page, testMessage);

  await sleepForPersistence(persistenceType);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !document.getElementById('loading'));

  await waitForTextInPage(page, testMessage);

  const persistedUsername = await page.evaluate(() => {
    const input = document.querySelector(
      'input[placeholder*="name" i]',
    ) as HTMLInputElement;
    return input ? input.value : null;
  });
  expect(persistedUsername).toBe('PersistUser');
}

async function testChatSync(page1: Page, page2: Page) {
  // Send a message in page1 and verify it syncs to page2
  await page1.waitForSelector(
    'input[type="text"]:not([placeholder*="name" i])',
  );
  const testMessage = 'Synced message';
  await page1.type(
    'input[type="text"]:not([placeholder*="name" i])',
    testMessage,
  );
  await page1.keyboard.press('Enter');
  await waitForTextInPage(page1, testMessage);

  await page2.bringToFront();
  await page2.waitForSelector('.message');
  await waitForTextInPage(page2, testMessage);

  // Verify that username fields exist in both windows
  // (confirming settings store is separate and doesn't sync)
  const hasUsernameInput1 = await page1.evaluate(() => {
    return !!document.querySelector('input[placeholder*="name" i]');
  });
  const hasUsernameInput2 = await page2.evaluate(() => {
    return !!document.querySelector('input[placeholder*="name" i]');
  });

  expect(hasUsernameInput1).toBe(true);
  expect(hasUsernameInput2).toBe(true);
}

beforeAll(async () => {
  await initBrowser();
}, 60000);

afterAll(async () => {
  await closeBrowser();
});

describe('chat e2e tests', {concurrent: false}, () => {
  combinations.forEach((combo, index) => {
    test(
      `should create and run ${combo.name} app`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 100 + index;

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

          await testBasicApp(port, combo.framework, combo.appType, testChatApp);
        } finally {
          if (devServer) {
            await killProcess(devServer);
          }
        }
      },
    );
  });
});

describe('chat persistence e2e tests', () => {
  persistenceCombinations.forEach((combo, index) => {
    test(
      `should persist data with ${combo.persistenceType} in ${combo.name}`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 200 + index;

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
            await page.goto(url, {
              waitUntil: 'domcontentloaded',
            });

            try {
              await page.waitForFunction(
                () => !document.getElementById('loading'),
              );
            } catch (e) {}

            expect(await page.title()).toContain('TinyBase');

            await testChatPersistence(page, combo.persistenceType);

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

describe('chat sync e2e tests', () => {
  syncCombinations.forEach((combo, index) => {
    test(
      `should sync ${combo.name} between two windows`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 100 + combinations.length + index;

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
            await waitForTextInPage(page1, 'TinyBase');
            await waitForTextInPage(page2, 'TinyBase');

            await testChatSync(page1, page2);

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
