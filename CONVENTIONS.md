# TinyBase App Templates - Patterns & Conventions

This document defines the consistent patterns and conventions used across all TinyBase starter app templates to ensure uniformity and maintainability.

---

## File Naming Conventions

### React Files (.tsx)

- **PascalCase** for components: `App.tsx`, `TodoInput.tsx`, `GameStatus.tsx`
- Store components match their purpose: `Store.tsx`, `SettingsStore.tsx`, `ChatStore.tsx`

### Vanilla Files (.ts)

- **camelCase** for implementation files: `app.ts`, `todoInput.ts`, `gameStatus.ts`
- Store files use camelCase: `store.ts`, `settingsStore.ts`, `chatStore.ts`

### CSS Files

- Match their component's casing: `todoInput.css`, `gameStatus.css`

---

## Component Naming Conventions

### React Components

- **PascalCase** component names: `TodoInput`, `Messages`, `Game`
- Store components: `Store`, `SettingsStore`, `ChatStore`, `CanvasStore`

### Vanilla Functions

- **camelCase** with `create` prefix: `createTodoInput()`, `createMessages()`, `createGame()`
- Returns the DOM element: `HTMLDivElement`, `HTMLCanvasElement`, etc.

---

## Export Patterns

### React Components

```typescript
// Define and export component
export const App = () => {
  return (
    <StrictMode>
      <Provider>
        {/* ... */}
      </Provider>
    </StrictMode>
  );
};
```

### Vanilla Functions

```typescript
export const createTodoInput = (store: TodosStore): HTMLDivElement => {
  // ...
};
```

---

## Store Patterns

### React Store Components

**Single Store Apps (todos, game):**

```typescript
import {createMergeableStore} from 'tinybase';
import {useCreateStore, useProvideStore /* hooks */} from 'tinybase/ui-react';

export const STORE_ID = 'todos'; // or 'game' - exported for use in components

export /* re-export hooks */ {};

export const Store = () => {
  const store = useCreateStore(() =>
    createMergeableStore().setTable('todos', {
      /* ... */
    }),
  );

  useProvideStore(STORE_ID, store);

  // Persistence (if enabled)
  {{#if persist}}
    {{#if persistLocalStorage}}
      useCreatePersister(
        store,
        (store) => createLocalPersister(store, STORE_ID),
        [],
        async (persister) => {
          await persister.startAutoLoad();
          await persister.startAutoSave();
        },
      );
    {{/if}}
    // Similar patterns for persistSqlite and persistPglite
  {{/if}}

  // Synchronization (if enabled)
  {{#if sync}}
    // ... synchronizer setup
  {{/if}}

  return null;
};
```

**Multi-Store Apps (chat, drawing):**

```typescript
// SettingsStore.tsx
export const STORE_ID = 'settings'; // exported for use in components

export const SettingsStore = () => {
  const store = useCreateStore(() =>
    createStore().setValue('username', 'Carol'),
  );

  useProvideStore(STORE_ID, store);

  return null;
};

// ChatStore.tsx or CanvasStore.tsx
export const STORE_ID = 'chat'; // or 'canvas' - exported for use in components

export const ChatStore = () => {
  const store = useCreateStore(() =>
    createMergeableStore().setTable('messages', {}),
  );

  useProvideStore(STORE_ID, store);

  return null;
};
```

### Vanilla Store Files

**Single Store Apps:**

```typescript
import {createMergeableStore} from 'tinybase';

// Note: STORE_ID not exported in vanilla - stores are passed directly as instances

export const store = createMergeableStore().setTable('todos', {
  /* ... */
});

// Persistence (if enabled)
{{#if persist}}
  {{#if persistLocalStorage}}
    const persister = createLocalPersister(store, 'todos');
    persister.startAutoLoad().then(() => persister.startAutoSave());
  {{/if}}
  // Similar patterns for persistSqlite and persistPglite
{{/if}}

// Synchronization (if enabled)
{{#if sync}}
  // ... synchronizer setup
{{/if}}

export type TodosStore = typeof store; // or GameStore
```

**Multi-Store Apps:**

```typescript
// settingsStore.ts
// Note: STORE_ID not exported in vanilla - stores are passed directly as instances

export const settingsStore = createStore().setValue('username', 'Carol');

export type SettingsStore = typeof settingsStore;

// chatStore.ts or canvasStore.ts
export const chatStore = createMergeableStore().setTable('messages', {});

export type ChatStore = typeof chatStore; // or CanvasStore
```

### Store Type Naming

- **Single store apps**: Use descriptive name matching the app: `TodosStore`, `GameStore`
- **Multi-store apps**: Use descriptive names for each store: `SettingsStore`, `ChatStore`, `CanvasStore`
- Always export as: `export type [StoreName] = typeof store;`

---

## App Structure

### React App.tsx

```typescript
import {StrictMode} from 'react';
import {Provider} from 'tinybase/ui-react';
import {Inspector} from 'tinybase/ui-react-inspector';
import {Store} from './Store'; // or multiple stores
import {/* UI components */} from './ComponentName';

const App = () => {
  return (
    <StrictMode>
      <Provider>
        <Store /> {/* or <SettingsStore /><ChatStore /> */}
        {/* UI components */}
        <Inspector />
      </Provider>
    </StrictMode>
  );
};

export {App};
```

### Vanilla app.ts

```typescript
import {store} from './store'; // or multiple stores
import {createComponentName} from './componentName';

const app = (root: HTMLElement) => {
  const appElement = document.createElement('div');
  appElement.id = 'app';
  root.appendChild(appElement);

  appElement.appendChild(createComponentName(store));
  // ... more components
};

export {app};
```

---

## Component Patterns

### React Components

- Import hooks from Store files (not directly from tinybase)
- Use store ID when accessing multi-store setups: `useValue('username', 'settings')`
- Export component with: `export {ComponentName};` or `export const ComponentName = () => { ... };`

### Vanilla Components

- Import typed store: `import type {TodosStore} from './store';`
- Components accept store as parameter: `(store: TodosStore)`
- Components manage their own updates via listeners
- Return DOM elements that can be appended

**Pattern for self-updating vanilla components:**

```typescript
export const createMessages = (store: ChatStore): HTMLDivElement => {
  const container = document.createElement('div');

  const render = () => {
    // Update DOM based on store state
  };

  // Initial render
  render();

  // Listen for changes
  store.addTablesListener(render);

  return container;
};
```

---

## Schema Patterns

### With Schemas (Optional)

Both React and vanilla support schema typing via conditionals:

**React:**

```typescript
{{#if schemas}}
  import {createMergeableStore} from 'tinybase/with-schemas';
  import * as UiReact from 'tinybase/ui-react/with-schemas';

  const SCHEMA = {/* ... */} as const;
  type Schemas = [typeof SCHEMA, NoValuesSchema];

  const {useCreateStore, useProvideStore, /* ... */} =
    UiReact as UiReact.WithSchemas<Schemas>;
{{else}}
  import {createMergeableStore} from 'tinybase';
  import {useCreateStore, useProvideStore, /* ... */} from 'tinybase/ui-react';
{{/if}}
```

**Vanilla:**

```typescript
{{#if schemas}}
  import {createMergeableStore} from 'tinybase/with-schemas';

  const SCHEMA = {/* ... */} as const;
{{else}}
  import {createMergeableStore} from 'tinybase';
{{/if}}

export const store = createMergeableStore(){{#if schemas}}
  .setTablesSchema(SCHEMA){{/if}};
```

---

## Hybrid Logical Clock (HLC) Usage

When generating sortable unique IDs (e.g., for timestamp-based ordering), use HLC functions:

### Pattern

```typescript
import {getHlcFunctions} from 'tinybase';

// Call at module level (outside components/functions)
const [getNextHlc] = getHlcFunctions();

// Usage in component
const id = getNextHlc(); // Generates a sortable, unique timestamp-based ID
```

### Key Points

- `getHlcFunctions()` returns an **array**, use array destructuring: `const [getNextHlc] = ...`
- Call `getHlcFunctions()` at the **module level** (outside React components or vanilla functions)
- Use for IDs that need chronological ordering (e.g., drawing strokes, messages with timestamps)
- Don't use `getUniqueId()` when chronological ordering matters

### Example Usage (Drawing App)

```typescript
// Canvas.tsx or canvas.ts
import {getHlcFunctions} from 'tinybase';

const [getNextHlc] = getHlcFunctions(); // Module level

export const Canvas = () => {
  // ...
  const handleStart = () => {
    const strokeId = getNextHlc(); // Sortable ID
    store.setRow('strokes', strokeId, {...});
  };
};
```

---

## Type Coercion Patterns

### React Components

When dealing with potentially undefined values from stores:

```typescript
// Preferred: String coercion with +
const username = useValue('username', STORE_ID);
<Input value={username + ''} onChange={...} />

// Alternative: Nullish coalescing
<Input value={username ?? ''} onChange={...} />
```

### Vanilla Components

When retrieving typed values from stores:

```typescript
// Use 'as' type assertions when type is known
const username = settingsStore.getValue('username') as string;

// Use nullish coalescing for optional values
const points = (store.getCell('strokes', id, 'points') as string) ?? '[]';
```

### Unused Parameters

Prefix unused parameters with underscore to indicate intentional non-use:

```typescript
export const createUsernameInput = (
  settingsStore: SettingsStore,
  _chatStore: ChatStore, // Underscore indicates intentionally unused
): HTMLDivElement => {
  // Only uses settingsStore
};
```

---

## Store Architecture

### Single Store Apps

- Use when all data belongs to one logical domain
- Examples: **todos** (task list), **game** (tic-tac-toe state)
- Store ID matches app name: `'todos'`, `'game'`

### Multi-Store Apps

- Use when data falls into distinct domains
- Examples: **chat** (settings + messages), **drawing** (settings + canvas)
- Settings store: Non-mergeable `createStore()` for local preferences
- Main store: Mergeable `createMergeableStore()` for collaborative data

---

## Import Organization

### Order of imports:

1. React/external libraries
2. TinyBase imports (with schema conditionals)
3. Store imports
4. Component imports (with `{{includeFile}}` directives)
5. CSS imports

### Example:

```typescript
import {StrictMode} from 'react';
import {Provider} from 'tinybase/ui-react';
import {Inspector} from 'tinybase/ui-react-inspector';
{{includeFile template="src/todos/Store.tsx.hbs" output="src/Store.tsx"}}
import {Store} from './Store';
{{includeFile template="src/todos/TodoInput.tsx.hbs" output="src/TodoInput.tsx"}}
import {TodoInput} from './TodoInput';
```

---

## Component Hierarchy Examples

### Todos App

```
App
├── Store
├── TodoInput
└── TodoList
    └── TodoItem (repeated)
```

### Chat App

```
App
├── SettingsStore
├── ChatStore
├── UsernameInput
├── Messages
│   └── Message (repeated)
└── MessageInput
```

### Drawing App

```
App
├── SettingsStore
├── CanvasStore
├── DrawingControls
│   ├── ColorPicker
│   └── BrushSize
└── Canvas
```

### Game App

```
App
├── Store
└── Game
    ├── GameStatus
    ├── Board
    │   └── Square (repeated)
    └── Button
```

---

## Persistence Patterns

### Order of Initialization

Persistence should be configured **before** synchronization to avoid race conditions.

**React Pattern:**

```typescript
export const Store = () => {
  const store = useCreateStore(() => createMergeableStore());

  useProvideStore(STORE_ID, store);

  // 1. Configure persistence FIRST
  useCreatePersister(
    store,
    (store) => createLocalPersister(store, STORE_ID),
    [],
    async (persister) => {
      await persister.startAutoLoad();
      await persister.startAutoSave();
    },
  );

  // 2. Configure synchronization SECOND
  useCreateSynchronizer(store, async (store) => {
    const synchronizer = await createWsSynchronizer(/* ... */);
    await synchronizer.startSync();
    return synchronizer;
  });

  return null;
};
```

**Vanilla Pattern:**

```typescript
export const store = createMergeableStore();

// 1. Configure persistence FIRST
const persister = createLocalPersister(store, 'todos');
persister.startAutoLoad().then(() => persister.startAutoSave());

// 2. Configure synchronization SECOND
createWsSynchronizer(store, new ReconnectingWebSocket(SERVER)).then(
  async (synchronizer) => {
    await synchronizer.startSync();
  },
);
```

### Persister Types

**Local Storage (Browser):**

```typescript
import {createLocalPersister} from 'tinybase/persisters/persister-browser';

const persister = createLocalPersister(store, STORE_ID);
await persister.startAutoLoad();
await persister.startAutoSave();
```

**SQLite (WebAssembly):**

```typescript
import {createSqliteWasmPersister} from 'tinybase/persisters/persister-sqlite-wasm';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const sqlite3 = await sqlite3InitModule();
const db = new sqlite3.oo1.DB(':local:' + STORE_ID, 'c');
const persister = createSqliteWasmPersister(store, sqlite3, db, STORE_ID);
await persister.startAutoLoad();
await persister.startAutoSave();
```

**PGLite (PostgreSQL in Browser):**

```typescript
import {createPglitePersister} from 'tinybase/persisters/persister-pglite';
import {PGlite} from '@electric-sql/pglite';

const pgLite = await PGlite.create('idb://' + STORE_ID);
const persister = createPglitePersister(store, pgLite, STORE_ID);
await persister.startAutoLoad();
await persister.startAutoSave();
```

### Multi-Store Persistence

In apps with multiple stores (chat, drawing), **both** stores get persistence:

```typescript
// settingsStore - local preferences
const settingsPersister = createLocalPersister(settingsStore, 'settings');
settingsPersister.startAutoLoad().then(() => settingsPersister.startAutoSave());

// chatStore - collaborative data (also gets persistence AND sync)
const chatPersister = createLocalPersister(chatStore, 'chat');
chatPersister.startAutoLoad().then(() => chatPersister.startAutoSave());
```

### Schema Support

When using schemas, import from the schema-aware paths:

```typescript
{{#if schemas}}
  import {createLocalPersister} from 'tinybase/persisters/persister-browser/with-schemas';
  import {useCreatePersister} from 'tinybase/ui-react/with-schemas';
{{else}}
  import {createLocalPersister} from 'tinybase/persisters/persister-browser';
  import {useCreatePersister} from 'tinybase/ui-react';
{{/if}}
```

---

## Testing Conventions

### Test Organization

Tests are organized in the `test/e2e/` directory with one file per app type:

- `todos.test.ts`
- `chat.test.ts`
- `drawing.test.ts`
- `game.test.ts`
- `common.ts` (shared utilities)

### Test Categories

Each app has three categories of tests:

1. **Basic Tests**: Verify core functionality across all combinations
2. **Persistence Tests**: Verify data persists after reload (sqlite, pglite)
3. **Sync Tests**: Verify data syncs between two browser windows

### Combination Arrays

Define test combinations consistently:

```typescript
// Basic tests: All framework/language/schema combinations
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
  // ... etc
];

// Persistence tests: Only TypeScript (both vanilla and react)
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
  // ... react versions
];

// Sync tests: Only JavaScript (both vanilla and react)
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
];
```

### Test Function Patterns

**Basic Test Function:**

```typescript
async function testTodosApp(page: Page) {
  // Test core functionality
  await page.waitForSelector('input[type="text"]');
  await page.type('input[type="text"]', 'Test todo item');
  await page.keyboard.press('Enter');
  await waitForTextInPage(page, 'Test todo item');
}
```

**Persistence Test Function:**

```typescript
async function testTodosPersistence(page: Page, persistenceType: string) {
  // 1. Perform action and capture state
  const testTodo = `Persisted todo ${persistenceType}`;
  await page.type('input[type="text"]', testTodo);
  await page.keyboard.press('Enter');

  // 2. Wait for persistence
  await sleepForPersistence(persistenceType);

  // 3. Reload page
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => !document.getElementById('loading'));

  // 4. Verify state persisted
  await waitForTextInPage(page, testTodo);
}
```

**Sync Test Function:**

```typescript
async function testTodosSync(page1: Page, page2: Page) {
  // 1. Perform action in page1 and verify it syncs to page2
  const testTodo = 'Synced todo item';
  await page1.type('input[type="text"]', testTodo);
  await page1.keyboard.press('Enter');
  await waitForTextInPage(page1, testTodo);

  await page2.bringToFront();
  await waitForTextInPage(page2, testTodo);

  // 2. (Optional) Perform bidirectional action
  // Check a todo in page2 and verify it syncs to page1
  const checkbox = await page2.waitForSelector('input[type="checkbox"]');
  await checkbox!.click();

  await page1.bringToFront();
  await page1.waitForFunction(() => {
    const cb = document.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    return cb && cb.checked;
  });
}
```

### Sync Test Principles

**What Should Sync:**

- Main data stores (todos, messages, canvas drawings, game state)
- Use `createMergeableStore()` for data that syncs

**What Should NOT Sync:**

- Local settings stores (username in chat, brush color/size in drawing)
- Use `createStore()` (non-mergeable) for local settings

**Testing Non-Sync Behavior:**

For apps with separate settings stores (chat, drawing), verify settings DON'T sync:

```typescript
// Drawing example: Verify color/size settings don't sync
async function testDrawingSync(page1: Page, page2: Page) {
  // Test canvas data syncs (omitted for brevity)

  // Verify that settings DON'T sync
  // Change settings in page2
  await page2.waitForSelector('.colorBtn');
  const colorButtons = await page2.$$('.colorBtn');
  await colorButtons[1]!.click();

  // Wait to ensure changes would have synced if they were going to
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Verify page1 still has original values
  await page1.bringToFront();
  const page1Color = await page1.evaluate(() => {
    const activeBtn = document.querySelector('.colorBtn.active');
    return activeBtn ? (activeBtn as HTMLElement).style.background : null;
  });

  expect(page1Color).toBe('rgb(216, 27, 96)'); // Original default color
}

// Chat example: Verify username fields exist (simpler check)
async function testChatSync(page1: Page, page2: Page) {
  // Test message syncs (omitted for brevity)

  // Verify that username fields exist in both windows
  // (confirming settings store is separate and doesn't sync)
  const hasUsernameInput1 = await page1.evaluate(() => {
    return !!document.querySelector('input[placeholder*="name" i]');
  });
  const hasUsernameInput2 = await page2.evaluate(() => {
    return !!document.querySelector('input[placeholder*="name" i]');
  });

  expect(hasUsernameInput1).toBe(true);
  expect(hasUsernameInput2).toBe(true);
}
```

### Common Utilities

Use shared functions from `common.ts`:

```typescript
import {
  setupTestProject, // Creates and configures test project
  startDevServer, // Starts Vite dev server
  killProcess, // Stops dev server
  waitForTextInPage, // Waits for text to appear on page
  sleepForPersistence, // Waits appropriate time for persistence type
  initBrowser, // Initializes Puppeteer browser
  closeBrowser, // Closes Puppeteer browser
  setupPageErrorHandling, // Sets up error/warning capture
} from './common';
```

### Test Structure

Each test file follows this structure:

```typescript
import {describe, test, beforeAll, afterAll, expect} from 'vitest';
import {} from /* common utilities */ './common';

// Define combinations
const combinations = [
  /* ... */
];
const persistenceCombinations = [
  /* ... */
];
const syncCombinations = [
  /* ... */
];

// Test functions
async function testApp(page: Page) {
  /* ... */
}
async function testPersistence(page: Page, persistenceType: string) {
  /* ... */
}
async function testSync(page1: Page, page2: Page) {
  /* ... */
}

// Lifecycle hooks
beforeAll(async () => {
  await initBrowser();
}, 60000);

afterAll(async () => {
  await closeBrowser();
});

// Test suites
describe('app e2e tests', {concurrent: false}, () => {
  combinations.forEach((combo, index) => {
    test(
      `should create and run ${combo.name} app`,
      {timeout: 120000},
      async () => {
        // Test implementation
      },
    );
  });
});

describe('app persistence e2e tests', () => {
  persistenceCombinations.forEach((combo, index) => {
    test(
      `should persist data with ${combo.persistenceType} in ${combo.name}`,
      {timeout: 120000},
      async () => {
        // Test implementation
      },
    );
  });
});

describe('app sync e2e tests', () => {
  syncCombinations.forEach((combo, index) => {
    test(
      `should sync ${combo.name} between two windows`,
      {timeout: 120000},
      async () => {
        // Test implementation
      },
    );
  });
});
```

### Port Allocation

Use consistent port offsets per app type:

- **Todos**: `BASE_PORT + 0-99` (5173-5272)
- **Chat**: `BASE_PORT + 100-199` (5273-5372)
- **Drawing**: `BASE_PORT + 300-399` (5473-5572)
- **Game**: `BASE_PORT + 500-599` (5673-5772)

For sync tests, add `combinations.length` to avoid port conflicts with persistence tests.

### Performance Optimizations

**Node Modules Handling:**

Use `rename()` instead of `cp()` + `rm()` for instant node_modules backup/restore:

```typescript
// Backup
if (existsSync(nodeModulesPath)) {
  await rename(nodeModulesPath, nodeModulesBackup);
}

// Restore
if (existsSync(nodeModulesBackup)) {
  await rename(nodeModulesBackup, nodeModulesPath);
}
```

This provides ~73% speed improvement (e.g., 113s → 30s for chat tests).

### Vitest Configuration

Use workspace configuration for separate unit and e2e test settings:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    projects: [
      {
        name: 'unit',
        test: {exclude: ['**/e2e/**', ...configDefaults.exclude]},
      },
      {
        name: 'e2e',
        test: {
          include: ['**/e2e/**/*.test.ts'],
          fileParallelism: false, // Run test files sequentially
          retry: 2, // Retry failed tests twice
        },
      },
    ],
  },
});
```

### Test Comments

Add clear comments to test functions explaining:

- What action is being performed
- What is expected to sync (or not sync)
- Bidirectional sync behavior

Example:

```typescript
async function testTodosSync(page1: Page, page2: Page) {
  // Add a todo in page1 and verify it syncs to page2
  // ...
  // Check a todo in page2 and verify it syncs to page1
  // ...
}
```

---

## Key Principles

1. **Consistency**: React and vanilla versions should follow parallel patterns
2. **Self-Management**: Components manage their own updates via hooks/listeners
3. **Type Safety**: All vanilla stores export typed interfaces
4. **Clear Naming**: Function/component names clearly indicate their purpose
5. **Simplicity**: App files should be minimal, delegating logic to components
6. **Conventions**: Follow established patterns unless there's a compelling reason not to
7. **Test Coverage**: Every app has basic, persistence, and sync tests
8. **Test Reliability**: Use proper waits, retries, and error handling for consistent test execution

---

## Checklist for New Apps

- [ ] React App.tsx uses separate export statement
- [ ] Vanilla app.ts exports `{app}`
- [ ] Store type names are descriptive (TodosStore, GameStore, etc.)
- [ ] React components import hooks from Store files
- [ ] Vanilla components accept typed store parameters
- [ ] Vanilla components manage their own updates with listeners
- [ ] File naming matches conventions (PascalCase React, camelCase vanilla)
- [ ] Component exports follow patterns (separate export for React)
- [ ] Store IDs are string constants matching app domain
- [ ] Schema support uses conditionals consistently
- [ ] E2E tests cover basic, persistence, and sync scenarios
- [ ] Sync tests verify what syncs and what doesn't
- [ ] Multi-store apps have separate stores for settings vs data
- [ ] Settings stores use `createStore()` (non-mergeable)
- [ ] Data stores use `createMergeableStore()` for sync support
