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
];

async function testDrawingApp(page: Page) {
  const canvas = await page.waitForSelector('canvas');

  const box = await canvas!.boundingBox();
  await page.mouse.move(box!.x + 50, box!.y + 50);
  await page.mouse.down();
  await page.mouse.move(box!.x + 150, box!.y + 150);
  await page.mouse.up();

  await sleep(100);

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

  await sleep(persistenceType === 'pglite' ? 1000 : 500);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !document.getElementById('loading'));

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
    )!.set!.call(input, '20'); // apparently
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });

  await sleep(persistenceType === 'pglite' ? 1000 : 1500);
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !document.getElementById('loading'));

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
