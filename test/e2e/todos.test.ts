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
    framework: 'svelte',
    appType: 'todos',
    name: 'js-svelte-todos',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'todos',
    name: 'ts-svelte-todos',
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
    name: 'ts-react-todos-tinywidgets',
    tinyWidgets: true,
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
    framework: 'svelte',
    appType: 'todos',
    name: 'ts-svelte-todos-schemas',
    schemas: true,
  },
];

const persistenceCombinations = [
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'todos',
    persistenceType: 'sqlite',
    name: 'ts-vanilla-todos-persist-sqlite',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'todos',
    persistenceType: 'pglite',
    name: 'ts-vanilla-todos-persist-pglite',
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
    language: 'typescript',
    framework: 'svelte',
    appType: 'todos',
    persistenceType: 'sqlite',
    name: 'ts-svelte-todos-persist-sqlite',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'todos',
    persistenceType: 'pglite',
    name: 'ts-svelte-todos-persist-pglite',
  },
];

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
  {
    language: 'javascript',
    framework: 'svelte',
    appType: 'todos',
    name: 'js-svelte-todos-sync',
  },
];

async function testTodosApp(page: Page) {
  const inputSelector = '#todoInput input';
  const checkboxSelector =
    '.todoItem input[type="checkbox"], .todoItem button[title^="Toggle"]';

  const input = await page.waitForSelector(inputSelector);
  await page.type(inputSelector, 'Test todo item');

  const inputValue = await page.evaluate(() => {
    const inp = document.querySelector('#todoInput input') as HTMLInputElement;
    return inp ? inp.value : '';
  });

  expect(inputValue).toBe('Test todo item');

  await page.keyboard.press('Enter');

  await waitForTextInPage(page, 'Test todo item');

  const checkbox = await page.waitForSelector(checkboxSelector);
  await checkbox!.click();
  await page.waitForFunction(() => {
    return !!document.querySelector('.todoItem.completed');
  });
}

async function testTodosPersistence(page: Page, persistenceType: string) {
  const inputSelector = '#todoInput input';
  const checkboxSelector =
    '.todoItem input[type="checkbox"], .todoItem button[title^="Toggle"]';
  const testTodo = `Persisted todo ${persistenceType}`;
  await page.waitForSelector(inputSelector, {visible: true});
  await page.type(inputSelector, testTodo);
  await page.keyboard.press('Enter');
  await waitForTextInPage(page, testTodo);

  await sleepForPersistence(persistenceType);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !document.getElementById('loading'));

  await waitForTextInPage(page, testTodo);

  const checkbox = await page.waitForSelector(checkboxSelector);
  await checkbox!.click();
  await page.waitForFunction(() => {
    return !!document.querySelector('.todoItem.completed');
  });

  await sleepForPersistence(persistenceType);
  await page.reload({waitUntil: 'domcontentloaded'});

  await page.waitForFunction(() => {
    return !!document.querySelector('.todoItem.completed');
  });
}

async function testTodosSync(page1: Page, page2: Page) {
  const inputSelector = '#todoInput input';
  const checkboxSelector =
    '.todoItem input[type="checkbox"], .todoItem button[title^="Toggle"]';
  // Add a todo in page1 and verify it syncs to page2
  const testTodo = 'Synced todo item';
  await page1.bringToFront();
  await page1.waitForSelector(inputSelector, {visible: true});
  await page1.type(inputSelector, testTodo);
  await page1.keyboard.press('Enter');
  await waitForTextInPage(page1, testTodo);

  await page2.bringToFront();
  await waitForTextInPage(page2, testTodo);

  // Check a todo in page2 and verify it syncs to page1
  const checkbox = await page2.waitForSelector(checkboxSelector);
  await checkbox!.click();
  await page2.waitForFunction(() => {
    return !!document.querySelector('.todoItem.completed');
  });

  await page1.bringToFront();
  await page1.waitForFunction(() => {
    return !!document.querySelector('.todoItem.completed');
  });
}

beforeAll(async () => {
  await initBrowser();
}, 60000);

afterAll(async () => {
  await closeBrowser();
});

describe('todos e2e tests', {concurrent: false}, () => {
  combinations.forEach((combo, index) => {
    test(
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

          await testBasicApp(
            port,
            combo.framework,
            combo.appType,
            testTodosApp,
            combo.name,
          );
        } finally {
          if (devServer) {
            await killProcess(devServer);
          }
        }
      },
    );
  });
});

describe('todos persistence e2e tests', () => {
  persistenceCombinations.forEach((combo, index) => {
    test(
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

          const url = `http://localhost:${port}`;
          const page = await browser.newPage();

          const {checkErrors} = setupPageErrorHandling(page);

          try {
            await page.goto(url, {waitUntil: 'domcontentloaded'});

            await page.waitForFunction(
              () => !document.getElementById('loading'),
            );

            expect(await page.title()).toContain('TinyBase');

            await testTodosPersistence(page, combo.persistenceType);

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

describe('todos sync e2e tests', () => {
  syncCombinations.forEach((combo, index) => {
    test(
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

            await testTodosSync(page1, page2);

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
