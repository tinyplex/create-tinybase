import {describe, expect, it} from 'vitest';
import {postProcessFile} from '../src/postProcess.js';
import {TemplateEngine} from '../src/templateEngine.js';

const configs = {
  'ts-react': {
    projectName: 'test-ts-react',
    language: 'typescript',
    framework: 'react',
    isTypescript: true,
    isReact: true,
    ext: 'tsx',
  },
  'ts-vanilla': {
    projectName: 'test-ts-vanilla',
    language: 'typescript',
    framework: 'vanilla',
    isTypescript: true,
    isReact: false,
    ext: 'ts',
  },
  'js-react': {
    projectName: 'test-js-react',
    language: 'javascript',
    framework: 'react',
    isTypescript: false,
    isReact: true,
    ext: 'jsx',
  },
  'js-vanilla': {
    projectName: 'test-js-vanilla',
    language: 'javascript',
    framework: 'vanilla',
    isTypescript: false,
    isReact: false,
    ext: 'js',
  },
};

describe('template files', () => {
  for (const [name, context] of Object.entries(configs)) {
    describe(name, () => {
      it('should generate package.json', async () => {
        const engine = new TemplateEngine(context, './templates');
        const processed = await engine.processTemplate(
          'base/package.json.template',
        );

        const {content} = await postProcessFile('package.json', processed, {
          prettier: false,
          transpileToJS: false,
        });

        expect(content).toMatchSnapshot();
      });

      it('should generate index.html', async () => {
        const engine = new TemplateEngine(context, './templates');
        const processed = await engine.processTemplate(
          'base/index.html.template',
        );

        const {content} = await postProcessFile('index.html', processed, {
          prettier: true,
          transpileToJS: false,
        });

        expect(content).toMatchSnapshot();
      });

      it('should generate README.md', async () => {
        const engine = new TemplateEngine(context, './templates');
        const processed = await engine.processTemplate(
          'base/README.md.template',
        );

        const {content} = await postProcessFile('README.md', processed, {
          prettier: true,
          transpileToJS: false,
        });

        expect(content).toMatchSnapshot();
      });

      it('should generate .prettierrc', async () => {
        const engine = new TemplateEngine(context, './templates');
        const processed = await engine.processTemplate(
          'base/.prettierrc.template',
        );

        const {content} = await postProcessFile('.prettierrc', processed, {
          prettier: false,
          transpileToJS: false,
        });

        expect(content).toMatchSnapshot();
      });

      it('should generate index.css', async () => {
        const engine = new TemplateEngine(context, './templates');
        const processed = await engine.processTemplate(
          'src/index.css.template',
        );

        const {content} = await postProcessFile('index.css', processed, {
          prettier: true,
          transpileToJS: false,
        });

        expect(content).toMatchSnapshot();
      });

      it(`should generate index.${context.ext}`, async () => {
        const engine = new TemplateEngine(context, './templates');
        const processed = await engine.processTemplate(
          'src/index.template.tsx',
        );

        const {content} = await postProcessFile(
          `index.${context.ext}`,
          processed,
          {
            prettier: true,
            transpileToJS: context.language === 'javascript',
          },
        );

        expect(content).toMatchSnapshot();
      });

      if (context.isReact) {
        it(`should generate App.${context.ext}`, async () => {
          const engine = new TemplateEngine(context, './templates');
          const processed = await engine.processTemplate(
            'src/App.template.tsx',
          );

          const {content} = await postProcessFile(
            `App.${context.ext}`,
            processed,
            {
              prettier: true,
              transpileToJS: context.language === 'javascript',
            },
          );

          expect(content).toMatchSnapshot();
        });

        it('should generate vite.config.js', async () => {
          const engine = new TemplateEngine(context, './templates');
          const processed = await engine.processTemplate(
            'base/vite.config.js.template',
          );

          const {content} = await postProcessFile('vite.config.js', processed, {
            prettier: true,
            transpileToJS: false,
          });

          expect(content).toMatchSnapshot();
        });
      }

      if (context.isTypescript) {
        it('should generate tsconfig.json', async () => {
          const engine = new TemplateEngine(context, './templates');
          const processed = await engine.processTemplate(
            'base/tsconfig.json.template',
          );

          const {content} = await postProcessFile('tsconfig.json', processed, {
            prettier: false,
            transpileToJS: false,
          });

          expect(content).toMatchSnapshot();
        });

        it('should generate tsconfig.node.json', async () => {
          const engine = new TemplateEngine(context, './templates');
          const processed = await engine.processTemplate(
            'base/tsconfig.node.json.template',
          );

          const {content} = await postProcessFile(
            'tsconfig.node.json',
            processed,
            {
              prettier: false,
              transpileToJS: false,
            },
          );

          expect(content).toMatchSnapshot();
        });
      }
    });
  }
});
