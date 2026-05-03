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
  sleep,
  sleepForPersistence,
  startDevServer,
  testBasicApp,
} from './common.js';

const combinations = [
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
    framework: 'svelte',
    appType: 'drawing',
    name: 'js-svelte-drawing',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'drawing',
    name: 'ts-svelte-drawing',
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
    name: 'ts-react-drawing-tinywidgets',
    tinyWidgets: true,
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
    framework: 'svelte',
    appType: 'drawing',
    name: 'ts-svelte-drawing-schemas',
    schemas: true,
  },
];

const persistenceCombinations = [
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'drawing',
    persistenceType: 'sqlite',
    name: 'ts-vanilla-drawing-persist-sqlite',
  },
  {
    language: 'typescript',
    framework: 'vanilla',
    appType: 'drawing',
    persistenceType: 'pglite',
    name: 'ts-vanilla-drawing-persist-pglite',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'drawing',
    persistenceType: 'sqlite',
    name: 'ts-react-drawing-persist-sqlite',
  },
  {
    language: 'typescript',
    framework: 'react',
    appType: 'drawing',
    persistenceType: 'pglite',
    name: 'ts-react-drawing-persist-pglite',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'drawing',
    persistenceType: 'sqlite',
    name: 'ts-svelte-drawing-persist-sqlite',
  },
  {
    language: 'typescript',
    framework: 'svelte',
    appType: 'drawing',
    persistenceType: 'pglite',
    name: 'ts-svelte-drawing-persist-pglite',
  },
];

const syncCombinations = [
  {
    language: 'javascript',
    framework: 'vanilla',
    appType: 'drawing',
    name: 'js-vanilla-drawing-sync',
  },
  {
    language: 'javascript',
    framework: 'react',
    appType: 'drawing',
    name: 'js-react-drawing-sync',
  },
  {
    language: 'javascript',
    framework: 'svelte',
    appType: 'drawing',
    name: 'js-svelte-drawing-sync',
  },
];

async function testDrawingApp(page: Page) {
  const canvas = await page.waitForSelector('canvas');

  const box = await canvas!.boundingBox();
  await page.mouse.move(box!.x + 50, box!.y + 50);
  await page.mouse.down();
  await page.mouse.move(box!.x + 150, box!.y + 150);
  await page.mouse.up();

  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.some((value, index) => {
      if (index % 4 === 3) return false;
      return value > 20;
    });
  });

  const hasStrokes = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const ctx = canvas.getContext('2d');
    const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.some((value, index) => {
      if (index % 4 === 3) return false;
      return value > 20;
    });
  });
  expect(hasStrokes).toBe(true);
}

async function testDrawingPersistence(page: Page, persistenceType: string) {
  const canvas = await page.waitForSelector('canvas');
  const box = await canvas!.boundingBox();
  await page.mouse.move(box!.x + 50, box!.y + 50);
  await page.mouse.down();
  await page.mouse.move(box!.x + 100, box!.y + 100);
  await page.mouse.up();

  const canvasData = await page.evaluate(() => {
    const cnv = document.querySelector('canvas');
    return cnv ? cnv.toDataURL() : null;
  });

  await sleepForPersistence(persistenceType);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !document.getElementById('loading'));

  if (persistenceType === 'pglite') {
    await sleep(500);
  }

  const persistedCanvasData = await page.evaluate(() => {
    const cnv = document.querySelector('canvas');
    return cnv ? cnv.toDataURL() : null;
  });
  expect(persistedCanvasData).toBe(canvasData);

  await page.waitForSelector('.colorBtn');
  const colorButtons = await page.$$('.colorBtn');
  await colorButtons[1]!.click();

  const sizeSlider = await page.waitForSelector('input[type="range"]');
  await sizeSlider?.evaluate((slider) => {
    const input = slider as HTMLInputElement;
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, '20');
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });

  await sleepForPersistence(persistenceType);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !document.getElementById('loading'));

  if (persistenceType === 'pglite') {
    await sleep(500);
  }

  await page.waitForSelector('.colorBtn');

  const activeColor = await page.evaluate(() => {
    const activeBtn = document.querySelector('.colorBtn.active');
    return activeBtn ? (activeBtn as HTMLElement).style.background : null;
  });

  const persistedSize = await page.evaluate(() => {
    const slider = document.querySelector('#brushSizeValue');
    return slider ? (slider as HTMLInputElement).innerText : null;
  });

  expect(activeColor).toBe('rgb(25, 118, 210)');
  expect(persistedSize).toBe('20');
}

async function testDrawingSync(page1: Page, page2: Page) {
  // Draw on canvas in page1 and verify it syncs to page2
  await page1.bringToFront();
  const canvas = await page1.waitForSelector('canvas');
  const box = await canvas!.boundingBox();
  await page1.mouse.move(box!.x + 50, box!.y + 50);
  await page1.mouse.down();
  await page1.mouse.move(box!.x + 100, box!.y + 100);
  await page1.mouse.up();

  const canvasData = await page1.evaluate(() => {
    const cnv = document.querySelector('canvas');
    return cnv ? cnv.toDataURL() : null;
  });

  await page2.bringToFront();
  await page2.waitForFunction(
    (expectedData) => {
      const cnv = document.querySelector('canvas');
      return cnv && cnv.toDataURL() === expectedData;
    },
    {},
    canvasData,
  );

  const syncedCanvasData = await page2.evaluate(() => {
    const cnv = document.querySelector('canvas');
    return cnv ? cnv.toDataURL() : null;
  });
  expect(syncedCanvasData).toBe(canvasData);

  // Verify that settings (color, size) DON'T sync
  // Change settings in page2 and confirm page1 keeps original values
  await page2.waitForSelector('.colorBtn');
  const colorButtons = await page2.$$('.colorBtn');
  await colorButtons[1]!.click();

  const sizeSlider = await page2.waitForSelector('input[type="range"]');
  await sizeSlider?.evaluate((slider) => {
    const input = slider as HTMLInputElement;
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, '20');
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });

  // Wait a bit to ensure changes would have synced if they were going to
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await page1.bringToFront();
  const page1Color = await page1.evaluate(() => {
    const activeBtn = document.querySelector('.colorBtn.active');
    return activeBtn ? (activeBtn as HTMLElement).style.background : null;
  });
  const page1Size = await page1.evaluate(() => {
    const slider = document.querySelector('#brushSizeValue');
    return slider ? (slider as HTMLElement).innerText : null;
  });

  // Settings should remain at their original values (not synced)
  expect(page1Color).toBe('rgb(216, 27, 96)'); // Original default color
  expect(page1Size).toBe('5'); // Original default size
}

beforeAll(async () => {
  await initBrowser();
}, 60000);

afterAll(async () => {
  await closeBrowser();
});

describe('drawing e2e tests', {concurrent: false}, () => {
  combinations.forEach((combo, index) => {
    test(
      `should create and run ${combo.name} app`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 300 + index;

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
            testDrawingApp,
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

describe('drawing persistence e2e tests', () => {
  persistenceCombinations.forEach((combo, index) => {
    test(
      `should persist data with ${combo.persistenceType} in ${combo.name}`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 400 + index;

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

            await testDrawingPersistence(page, combo.persistenceType);

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

describe('drawing sync e2e tests', () => {
  syncCombinations.forEach((combo, index) => {
    test(
      `should sync ${combo.name} between two windows`,
      {timeout: 120000},
      async () => {
        const projectName = `test-${combo.name}`;
        const port = BASE_PORT + 300 + combinations.length + index;

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

            await testDrawingSync(page1, page2);

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
