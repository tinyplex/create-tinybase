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
// Define component
const App = () => {
  return (
    <StrictMode>
      <Provider>
        {/* ... */}
      </Provider>
    </StrictMode>
  );
};

// Export at end of file
export {App};
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

const STORE_ID = 'todos'; // or 'game'

export /* re-export hooks */ {};

export const Store = () => {
  const store = useCreateStore(() =>
    createMergeableStore(STORE_ID).setTable('todos', {
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
const STORE_ID = 'settings';

export const SettingsStore = () => {
  const store = useCreateStore(() =>
    createStore().setValue('username', 'Carol'),
  );

  useProvideStore(STORE_ID, store);

  return null;
};

// ChatStore.tsx or CanvasStore.tsx
const STORE_ID = 'chat'; // or 'canvas'

export const ChatStore = () => {
  const store = useCreateStore(() =>
    createMergeableStore(STORE_ID).setTable('messages', {}),
  );

  useProvideStore(STORE_ID, store);

  return null;
};
```

### Vanilla Store Files

**Single Store Apps:**

```typescript
import {createMergeableStore} from 'tinybase';

const STORE_ID = 'todos'; // or 'game'

export const store = createMergeableStore(STORE_ID).setTable('todos', {
  /* ... */
});

export type TodosStore = typeof store; // or GameStore
```

**Multi-Store Apps:**

```typescript
// settingsStore.ts
const STORE_ID = 'settings';

export const settingsStore = createStore().setValue('username', 'Carol');

export type SettingsStore = typeof settingsStore;

// chatStore.ts or canvasStore.ts
const STORE_ID = 'chat'; // or 'canvas'

export const chatStore = createMergeableStore(STORE_ID).setTable(
  'messages',
  {},
);

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

export const store = createMergeableStore(STORE_ID){{#if schemas}}
  .setTablesSchema(SCHEMA){{/if}};
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
