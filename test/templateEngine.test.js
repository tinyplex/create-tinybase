import {join} from 'path';
import {describe, expect, it} from 'vitest';
import {createContext, TemplateEngine} from '../src/templateEngine.js';

const TEMPLATES_DIR = join(process.cwd(), 'test', 'templates');

describe('TemplateEngine', () => {
  it('should process a simple template', async () => {
    const context = createContext({
      projectName: 'test-app',
      language: 'typescript',
      framework: 'react',
    });

    const engine = new TemplateEngine(context, TEMPLATES_DIR);
    const result = await engine.processTemplate('simple.ts');

    expect(result).toMatchSnapshot();
  });

  it('should evaluate directives with context access', async () => {
    const context = createContext({
      projectName: 'my-app',
      language: 'typescript',
      framework: 'react',
    });

    const engine = new TemplateEngine(context, TEMPLATES_DIR);
    const result = await engine.processTemplate('with-context.ts');

    expect(result).toMatchSnapshot();
  });

  it('should handle when() conditional helper', async () => {
    const context = createContext({
      projectName: 'test',
      language: 'typescript',
      framework: 'vanilla',
    });

    const engine = new TemplateEngine(context, TEMPLATES_DIR);
    const result = await engine.processTemplate('conditional.ts');

    expect(result).toMatchSnapshot();
  });

  it('should add imports to top of file', async () => {
    const context = createContext({
      projectName: 'test',
      language: 'typescript',
      framework: 'react',
    });

    const engine = new TemplateEngine(context, TEMPLATES_DIR);
    const result = await engine.processTemplate('imports.ts');

    expect(result).toMatchSnapshot();
  });

  it('should include entire files', async () => {
    const context = createContext({
      projectName: 'test',
      language: 'typescript',
      framework: 'react',
    });

    const engine = new TemplateEngine(context, TEMPLATES_DIR);
    const result = await engine.processTemplate('main.ts');

    expect(result).toMatchSnapshot();
  });

  it('should include named blocks from files', async () => {
    const context = createContext({
      projectName: 'test',
      language: 'typescript',
      framework: 'react',
    });

    const engine = new TemplateEngine(context, TEMPLATES_DIR);
    const result = await engine.processTemplate('use-block.ts');

    expect(result).toMatchSnapshot();
  });
});
