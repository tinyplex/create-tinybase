/**
 * Post-processing utilities for generated project files
 */

import * as esbuild from 'esbuild';

interface PostProcessOptions {
  prettier?: boolean;
  transpileToJS?: boolean;
}

/**
 * Post-process a file: format with prettier and optionally transpile TS to JS
 */
export async function postProcessFile(
  filePath: string,
  content: string,
  options: PostProcessOptions = {},
): Promise<{filePath: string; content: string}> {
  let processedContent = content;
  let processedPath = filePath;

  // Prettier formatting
  if (options.prettier) {
    try {
      const prettier = await import('prettier');
      const prettierConfig = {
        parser: inferParser(filePath),
        singleQuote: true,
        trailingComma: 'all' as const,
        bracketSpacing: false,
      };
      processedContent = await prettier.format(
        processedContent,
        prettierConfig,
      );
    } catch (error) {
      // If prettier fails, continue with unformatted content
      console.warn(`Failed to format ${filePath}:`, error);
    }
  }

  // Transpile TypeScript to JavaScript
  if (options.transpileToJS && isTypeScriptFile(filePath)) {
    try {
      const result = await esbuild.transform(processedContent, {
        loader: inferLoader(filePath),
        format: 'esm',
        target: 'es2020',
      });
      processedContent = result.code;
      processedPath = transpileExtension(filePath);
    } catch (error) {
      throw new Error(
        `Failed to transpile ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return {
    filePath: processedPath,
    content: processedContent,
  };
}

/**
 * Post-process all files in a directory
 */
export async function postProcessProject(
  projectPath: string,
  files: Map<string, string>,
  options: PostProcessOptions = {},
): Promise<Map<string, string>> {
  const processedFiles = new Map<string, string>();

  for (const [filePath, content] of files.entries()) {
    const {filePath: newPath, content: newContent} = await postProcessFile(
      filePath,
      content,
      options,
    );
    processedFiles.set(newPath, newContent);
  }

  return processedFiles;
}

function isTypeScriptFile(filePath: string): boolean {
  return /\.(ts|tsx)$/.test(filePath);
}

function transpileExtension(filePath: string): string {
  return filePath.replace(/\.tsx?$/, (match) => {
    return match === '.tsx' ? '.jsx' : '.js';
  });
}

function inferParser(filePath: string): string {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    return 'typescript';
  }
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    return 'babel';
  }
  if (filePath.endsWith('.json')) {
    return 'json';
  }
  if (filePath.endsWith('.css')) {
    return 'css';
  }
  if (filePath.endsWith('.html')) {
    return 'html';
  }
  if (filePath.endsWith('.md')) {
    return 'markdown';
  }
  return 'babel';
}

function inferLoader(
  filePath: string,
): 'ts' | 'tsx' | 'js' | 'jsx' | 'json' | 'css' {
  if (filePath.endsWith('.tsx')) return 'tsx';
  if (filePath.endsWith('.ts')) return 'ts';
  if (filePath.endsWith('.jsx')) return 'jsx';
  if (filePath.endsWith('.js')) return 'js';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.css')) return 'css';
  return 'js';
}
