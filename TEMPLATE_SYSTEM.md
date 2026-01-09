# Template System

The create-tinybase CLI now has a flexible, scalable template system that supports:

## Features

### 1. Template Directives with `///` and `/*/`

Templates use special comment syntax to execute JavaScript code during generation:

**Start-of-line directives** use triple-slash (`///`):

```typescript
/// if (context.isReact) addImport("import React from 'react';");
/// return when(context.isTypescript, 'const typed: string = "yes";');
```

**Inline directives** use comment-slash markers (`/*/ ... /*/`):

```typescript
const ext = "/*/ return context.ext; /*/";
const name = /*/ return context.projectName; /*/
```

### 2. Context Access

Templates have access to user's prompt answers through the `context` object:

```typescript
interface TemplateContext {
  projectName: string; // "my-app"
  language: 'typescript' | 'javascript';
  framework: 'react' | 'vanilla';
  isTypescript: boolean; // computed helper
  isReact: boolean; // computed helper
  ext: string; // "tsx", "ts", "jsx", or "js"
}
```

### 3. Helper Functions

#### `includeFile(path: string)`

Include an entire file from templates directory:

```typescript
/// return await includeFile('partials/store-setup.ts');
```

#### `includeBlock(path: string, blockName: string)`

Include a named block from a file:

```typescript
// In partials/blocks.ts:
/// BEGIN persist
const persister = createSqlitePersister(store, db);
await persister.load();
/// END persist

// In main template:
/// return await includeBlock('partials/blocks.ts', 'persist');
```

#### `addImport(statement: string)`

Add import to top of file (deduplicates automatically):

```typescript
/// if (context.isReact) addImport("import React from 'react';");
/// if (context.isReact) addImport("import ReactDOM from 'react-dom/client';");
```

#### `when(condition: boolean, content: string)`

Conditional content:

```typescript
/// return when(context.isTypescript, 'type Props = {title: string};');
/// return when(!context.isReact, 'const app = document.getElementById("app");');
```

### 4. Post-Processing

After templates are generated, files can be:

- **Formatted with Prettier** - ensures consistent style
- **Transpiled to JavaScript** - converts `.ts`→`.js`, `.tsx`→`.jsx`

```typescript
const result = await postProcessFile('Component.tsx', content, {
  prettier: true,
  transpileToJS: true, // only if language === 'javascript'
});
```

## Usage Example

```typescript
import {TemplateEngine, createContext} from './templateEngine.js';
import {postProcessFile} from './postProcess.js';

// Create context from user answers
const context = createContext({
  projectName: 'my-app',
  language: 'typescript',
  framework: 'react',
});

// Initialize engine
const engine = new TemplateEngine(context, './templates');

// Process template
let content = await engine.processTemplate('src/App.template.tsx');

// Post-process
const result = await postProcessFile('src/App.tsx', content, {
  prettier: true,
  transpileToJS: context.language === 'javascript',
});

// Write to disk
await writeFile(result.filePath, result.content);
```

## Template Organization

Suggested directory structure:

```
templates/
  ├── base/
  │   ├── package.json.template
  │   ├── index.html.template
  │   ├── README.md.template
  │   └── tsconfig.json.template
  ├── src/
  │   ├── index.template.tsx
  │   ├── App.template.tsx
  │   └── vanilla.template.ts
  └── partials/
      ├── store-blocks.ts
      ├── persisters.ts
      └── ui-components.ts
```

## Next Steps

To rebuild the TinyBase scaffold with this system:

1. Create template files in `templates/` directory
2. Use directives to handle TypeScript/JavaScript variations
3. Use directives to handle React/Vanilla variations
4. Extract common blocks to `partials/` for reuse
5. Update CLI to use template engine instead of current generator
