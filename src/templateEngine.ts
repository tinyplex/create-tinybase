/**
 * Template Engine for create-tinybase
 *
 * Processes template files with triple-slash directives (///)
 * that can execute JavaScript to generate dynamic content.
 */

interface TemplateContext {
  // User's prompt answers
  projectName: string;
  language: 'typescript' | 'javascript';
  framework: 'react' | 'vanilla';

  // Computed helpers
  isTypescript: boolean;
  isReact: boolean;
  ext: string; // file extension (ts, tsx, js, jsx)
}

interface FileState {
  content: string;
  imports: Set<string>;
  path: string;
}

interface TemplateHelpers {
  // Include a block of code from a partial file
  includeBlock: (path: string, blockName?: string) => string;

  // Include an entire file
  includeFile: (path: string) => string;

  // Add an import statement (will be added to top of file)
  addImport: (statement: string) => void;

  // Conditional content based on context
  when: (condition: boolean, content: string) => string;

  // Access to context
  context: TemplateContext;
}

export class TemplateEngine {
  private context: TemplateContext;
  private templateRoot: string;
  private currentFile: FileState | null = null;
  private helpers: TemplateHelpers;

  constructor(context: TemplateContext, templateRoot: string) {
    this.context = context;
    this.templateRoot = templateRoot;

    // Setup helper functions available to templates
    this.helpers = {
      includeBlock: this.includeBlock.bind(this),
      includeFile: this.includeFile.bind(this),
      addImport: this.addImport.bind(this),
      when: this.when.bind(this),
      context: this.context,
    };
  }

  /**
   * Process a template file and return the generated content
   */
  async processTemplate(templatePath: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const fullPath = path.join(this.templateRoot, templatePath);
    const rawContent = await fs.readFile(fullPath, 'utf-8');

    // Initialize file state
    this.currentFile = {
      content: '',
      imports: new Set<string>(),
      path: templatePath,
    };

    // Process line by line
    const lines = rawContent.split('\n');
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Check for triple-slash directive at start of line
      if (line.trim().startsWith('///')) {
        const directive = line.trim().slice(3).trim();
        const result = await this.evaluateDirective(directive);
        if (result) {
          processedLines.push(result);
        }
      } else {
        // Check for inline directives (/*/ ... /*/ within the line)
        const directiveRegex = /\/\*\/\s*(.+?)\s*\/\*\//g;
        let match;
        while ((match = directiveRegex.exec(line)) !== null) {
          const directive = match[1].trim();
          const result = await this.evaluateDirective(directive);
          line = line.replace(match[0], result);
        }
        processedLines.push(line);
      }
    }

    // Prepend imports at the top
    const imports = Array.from(this.currentFile.imports);
    const content = processedLines.join('\n');

    if (imports.length > 0) {
      return imports.join('\n') + '\n\n' + content;
    }

    return content;
  }

  /**
   * Evaluate a template directive
   */
  private async evaluateDirective(directive: string): Promise<string> {
    try {
      // Create a function with access to helpers
      const helperNames = Object.keys(this.helpers);
      const helperValues = Object.values(this.helpers);

      // Wrap in async function so we can use await
      const fn = new Function(
        ...helperNames,
        `return (async () => { ${directive} })()`,
      );

      const result = await fn(...helperValues);
      return result || '';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error evaluating directive "${directive}": ${message}`);
    }
  }

  /**
   * Include a named block from a partial file
   */
  private async includeBlock(
    partialPath: string,
    blockName?: string,
  ): Promise<string> {
    const content = await this.includeFile(partialPath);

    if (!blockName) {
      return content;
    }

    // Extract named block between /// BEGIN blockName and /// END blockName
    const beginMarker = `/// BEGIN ${blockName}`;
    const endMarker = `/// END ${blockName}`;

    const beginIndex = content.indexOf(beginMarker);
    const endIndex = content.indexOf(endMarker);

    if (beginIndex === -1 || endIndex === -1) {
      throw new Error(`Block "${blockName}" not found in ${partialPath}`);
    }

    const blockContent = content.substring(
      beginIndex + beginMarker.length,
      endIndex,
    );

    return blockContent.trim();
  }

  /**
   * Include an entire file
   */
  private async includeFile(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const fullPath = path.join(this.templateRoot, filePath);
    return await fs.readFile(fullPath, 'utf-8');
  }

  /**
   * Add an import statement to current file
   */
  private addImport(statement: string): void {
    if (!this.currentFile) {
      throw new Error('addImport called outside of file processing');
    }
    this.currentFile.imports.add(statement);
  }

  /**
   * Conditionally return content
   */
  private when(condition: boolean, content: string): string {
    return condition ? content : '';
  }
}

/**
 * Create template context from user answers
 */
export const createContext = (answers: {
  projectName: string;
  language: 'typescript' | 'javascript';
  framework: 'react' | 'vanilla';
}): TemplateContext => {
  const isTypescript = answers.language === 'typescript';
  const isReact = answers.framework === 'react';

  let ext = 'js';
  if (isTypescript) {
    ext = isReact ? 'tsx' : 'ts';
  } else if (isReact) {
    ext = 'jsx';
  }

  return {
    ...answers,
    isTypescript,
    isReact,
    ext,
  };
};
