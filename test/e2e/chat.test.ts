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
];

async function testChatApp(page: Page) {
  try {
    const usernameInput = await page.waitForSelector(
      'input[placeholder*="name" i]',
    );
    await usernameInput!.type('TestUser');
  } catch {}

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

  await sleep(persistenceType === 'pglite' ? 1500 : 500);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !document.getElementById('loading'));

  await waitForTextInPage(page, testMessage);
  await waitForTextInPage(page, 'PersistUser');
}

beforeAll(async () => {
  await initBrowser();
}, 60000);

afterAll(async () => {
  await closeBrowser();
});

describe('chat e2e tests', {concurrent: true}, () => {
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

          await sleep(200);

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
