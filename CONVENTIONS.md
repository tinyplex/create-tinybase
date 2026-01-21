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

const app = () => {
  const appContainer = document.getElementById('app')!;

  appContainer.appendChild(createComponentName(store));
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
const points = store.getCell('strokes', id, 'points') as string ?? '[]';
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

## Key Principles

1. **Consistency**: React and vanilla versions should follow parallel patterns
2. **Self-Management**: Components manage their own updates via hooks/listeners
3. **Type Safety**: All vanilla stores export typed interfaces
4. **Clear Naming**: Function/component names clearly indicate their purpose
5. **Simplicity**: App files should be minimal, delegating logic to components
6. **Conventions**: Follow established patterns unless there's a compelling reason not to

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
