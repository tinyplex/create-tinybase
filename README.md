# create-tinybase

A CLI tool to scaffold a new TinyBase application with full synchronization and local-first capabilities.

## Usage

```bash
npm init tinybase
```

This will prompt you with questions to configure your new TinyBase app:

- **Project name** - Name of your project directory
- **Language** - TypeScript or JavaScript
- **Framework** - React or Vanilla JS
- **App type** - Todo app, Chat app, Drawing app, or Tic-tac-toe game
- **Store schemas** - TypeScript type safety for stores (TypeScript only)
- **Synchronization** - Enable real-time sync between clients
- **Server code** - Include Node.js or Cloudflare Durable Objects server
- **Prettier** - Include Prettier for code formatting
- **ESLint** - Include ESLint for code linting

After creating your project:

```bash
cd my-tinybase-app/client
npm install
npm run dev
```

If you included server code:

```bash
# In a separate terminal
cd my-tinybase-app/server
npm install
npm run dev
```

Your app will be available at `http://localhost:5173`

## Features

- ⚡ **Fast Setup** - Get started in seconds with Vite
- 🔄 **Real-time Sync** - Built-in synchronization support
- 🎨 **Four Demo Apps** - Learn from complete examples
- 📦 **Zero Config** - Works out of the box
- 🔧 **Fully Customizable** - Modify templates to your needs
- 🌐 **Local-First** - Offline-capable by default
- 🔐 **Type-Safe** - Optional TypeScript schemas

## Configuration Guide

### Language Choice

**TypeScript** provides full type safety with:

- Typed store schemas (optional)
- IntelliSense support for TinyBase APIs
- Compile-time error checking
- Better IDE integration

**JavaScript** offers:

- Faster setup with no transpilation step
- Simpler learning curve
- Still fully functional with TinyBase

### Framework Choice

**React** provides:

- Component-based architecture
- React hooks for TinyBase stores
- Automatic re-rendering on store updates
- Full ecosystem support

**Vanilla JS** offers:

- No framework dependencies
- Smaller bundle size
- Direct DOM manipulation
- Manual listener-based updates

### App Types

**Todo App**

- Task list with add/complete/delete
- Single store for todos
- Demonstrates basic CRUD operations
- Perfect starter example

**Chat App**

- Multi-user messaging interface
- Dual stores: settings + messages
- Username configuration
- Real-time message sync

**Drawing App**

- Collaborative drawing canvas
- Brush size and color controls
- Dual stores: settings + canvas
- Optimized point-based stroke storage

**Tic-tac-toe Game**

- Two-player game board
- Win/draw detection
- Turn management
- Game state synchronization

### Store Schemas (TypeScript Only)

When enabled, schemas provide:

- Full TypeScript typing for store structure
- Runtime validation
- Better autocomplete
- Type-safe data access

Schemas define:

- Table structures with cell types
- Value types
- Default values
- Strict typing for all store operations

### Synchronization

**Enabled** (default):

- Real-time sync between browser tabs
- WebSocket-based synchronization
- Connects to demo server by default (wss://vite.tinybase.org)
- MergeableStore for conflict-free replication
- Automatic reconnection handling

**Disabled**:

- Local-only data storage
- No network dependencies
- Simpler architecture
- Still uses MergeableStore for consistency

### Server Code

When synchronization is enabled, you can include server code:

**Node.js Server** (port 8043):

- WebSocket server using `ws` library
- TinyBase server synchronizer
- Runs with `npm run dev` in server directory
- Easy to deploy to any Node.js host

**Cloudflare Durable Objects** (port 8787):

- Serverless WebSocket server
- Edge computing with Durable Objects
- Global distribution
- Runs locally with Wrangler

**No Server**:

- Connects to public demo server
- Great for prototyping
- No local server management needed

### Prettier & ESLint

**Prettier**:

- Automatic code formatting
- Consistent style across project
- Pre-configured settings
- Runs on save (with IDE integration)

**ESLint**:

- Code quality checks
- Catch common errors
- Import organization
- TypeScript-aware rules

## Project Structure

All apps are created with a monorepo structure:

```
my-tinybase-app/
├── package.json          # Root package (manages workspaces)
├── README.md            # Getting started guide
├── client/              # Client application
│   ├── package.json     # Client dependencies
│   ├── index.html       # Entry HTML
│   ├── public/          # Static assets
│   └── src/             # Source code
│       ├── App.tsx      # Main app component
│       ├── Store.tsx    # TinyBase store setup
│       └── ...          # App-specific components
└── server/              # Server code (optional)
    ├── package.json     # Server dependencies
    └── src/
        └── index.ts     # Server entry point
```

## Learn More

- [TinyBase Documentation](https://tinybase.org)
- [TinyBase GitHub](https://github.com/tinyplex/tinybase)
- [Synchronization Guide](https://tinybase.org/guides/synchronization)
- [React Integration](https://tinybase.org/guides/building-uis/using-react)

## License

MIT License - see [LICENSE](https://github.com/tinyplex/tinybase/blob/main/LICENSE) file for details.

This project is part of the TinyBase ecosystem, created by James Pearce.
