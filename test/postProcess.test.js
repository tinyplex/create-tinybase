import {describe, expect, it} from 'vitest';
import {postProcessFile} from '../src/postProcess.js';

describe('postProcess', () => {
  it('should format TypeScript with prettier', async () => {
    const unformatted = `const x={a:1,b:2};function hello(){return"world"}`;

    const result = await postProcessFile('test.ts', unformatted, {
      prettier: true,
    });

    expect(result.content).toContain('const x = {a: 1, b: 2};');
    expect(result.content).toContain('function hello()');
    expect(result.filePath).toBe('test.ts');
  });

  it('should transpile TypeScript to JavaScript', async () => {
    const typescript = `const greet = (name: string): string => {
  return \`Hello, \${name}!\`;
};`;

    const result = await postProcessFile('utils.ts', typescript, {
      transpileToJS: true,
    });

    expect(result.content).not.toContain(': string');
    expect(result.content).toContain('greet');
    expect(result.filePath).toBe('utils.js');
  });

  it('should transpile TSX to JSX', async () => {
    const tsx = `import React from 'react';

export const Component: React.FC<{title: string}> = ({title}) => {
  return <div>{title}</div>;
};`;

    const result = await postProcessFile('Component.tsx', tsx, {
      transpileToJS: true,
    });

    expect(result.content).not.toContain('React.FC');
    expect(result.content).not.toContain(': string');
    expect(result.content).toContain('Component');
    expect(result.filePath).toBe('Component.jsx');
  });

  it('should format and transpile together', async () => {
    const unformattedTS = `const add=(a:number,b:number):number=>{return a+b;}`;

    const result = await postProcessFile('math.ts', unformattedTS, {
      prettier: true,
      transpileToJS: true,
    });

    expect(result.content).not.toContain(':number');
    expect(result.content).toContain('add');
    // Should be formatted (spaces around =, etc)
    expect(result.content).toMatch(/const add\s*=\s*\(/);
    expect(result.filePath).toBe('math.js');
  });

  it('should handle non-TS files without transpiling', async () => {
    const css = 'body{margin:0;padding:0;}';

    const result = await postProcessFile('styles.css', css, {
      prettier: true,
      transpileToJS: true, // Should be ignored for CSS
    });

    expect(result.content).toContain('margin');
    expect(result.filePath).toBe('styles.css');
  });
});
