#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

TEST_DIR="$PROJECT_ROOT/tmp"
CLI_PATH="$PROJECT_ROOT/dist/cli.js"

# Parse arguments
FILTER=""
SKIP_INSTALL=false
PARALLEL_INSTALL=true
CLEAN=false
BUILD_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -t)
      FILTER="$2"
      shift 2
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    --no-parallel)
      PARALLEL_INSTALL=false
      shift
      ;;
    --clean)
      CLEAN=true
      shift
      ;;
    --build-only)
      BUILD_ONLY=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -t PATTERN    Only build projects matching pattern (e.g., 'chat', 'ts-react', 'charting')"
      echo "  --skip-install      Skip npm install (assumes deps already installed)"
      echo "  --no-parallel       Install dependencies sequentially instead of in parallel"
      echo "  --clean             Clean tmp directory (force fresh install)"
      echo "  --build-only        Create and install projects but don't start servers or browsers"
      echo "  --help              Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                           # Build all configured projects (reuse node_modules)"
      echo "  $0 -t chat             # Build only chat projects"
      echo "  $0 -t ts-react-chat    # Build only ts-react-chat"
      echo "  $0 -t tinywidgets      # Build only TinyWidgets projects"
      echo "  $0 -t charting         # Build only charting projects"
      echo "  $0 -t solid-todos      # Build only Solid todo projects"
      echo "  $0 -t svelte-todos     # Build only Svelte todo projects"
      echo "  $0 -t drawing --skip-install  # Build drawing projects, skip install"
      echo "  $0 --clean                   # Force fresh install for all projects"
      echo "  $0 --build-only              # Create all projects without running them"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

cleanup() {
  echo ""
  echo "Stopping servers..."
  pkill -P $$ 2>/dev/null || true
  kill ${PIDS[@]} 2>/dev/null || true
  pkill -f "vite.*--port.*(61[7-9][0-9]|62[0-6][0-9])" 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM EXIT

echo "Cleaning up any previous servers..."
pkill -f "vite.*--port.*(61[7-9][0-9]|62[0-6][0-9])" 2>/dev/null || true

mkdir -p "$TEST_DIR"

declare -a all_projects=(
  "test-js-vanilla-todos:javascript:vanilla:todos:6173:false"
  "test-ts-vanilla-todos:typescript:vanilla:todos:6174:false"
  "test-ts-vanilla-todos-schemas:typescript:vanilla:todos:6175:true"
  "test-ts-vanilla-todos-persist-sqlite:typescript:vanilla:todos:6176:false:sqlite"
  "test-ts-vanilla-todos-persist-pglite:typescript:vanilla:todos:6177:false:pglite"
  "test-js-react-todos:javascript:react:todos:6178:false"
  "test-ts-react-todos:typescript:react:todos:6179:false"
  "test-ts-react-todos-schemas:typescript:react:todos:6180:true"
  "test-ts-react-todos-persist-sqlite:typescript:react:todos:6181:false:sqlite"
  "test-ts-react-todos-persist-pglite:typescript:react:todos:6182:false:pglite"
  "test-ts-react-todos-tinywidgets:typescript:react:todos:6233:false:local-storage:true"
  "test-js-solid-todos:javascript:solid:todos:6240:false"
  "test-ts-solid-todos:typescript:solid:todos:6241:false"
  "test-ts-solid-todos-schemas:typescript:solid:todos:6242:true"
  "test-ts-solid-todos-persist-sqlite:typescript:solid:todos:6243:false:sqlite"
  "test-ts-solid-todos-persist-pglite:typescript:solid:todos:6244:false:pglite"
  "test-js-svelte-todos:javascript:svelte:todos:6213:false"
  "test-ts-svelte-todos:typescript:svelte:todos:6214:false"
  "test-ts-svelte-todos-schemas:typescript:svelte:todos:6215:true"
  "test-ts-svelte-todos-persist-sqlite:typescript:svelte:todos:6216:false:sqlite"
  "test-ts-svelte-todos-persist-pglite:typescript:svelte:todos:6217:false:pglite"

  "test-js-vanilla-chat:javascript:vanilla:chat:6183:false"
  "test-ts-vanilla-chat:typescript:vanilla:chat:6184:false"
  "test-ts-vanilla-chat-schemas:typescript:vanilla:chat:6185:true"
  "test-ts-vanilla-chat-persist-sqlite:typescript:vanilla:chat:6186:false:sqlite"
  "test-ts-vanilla-chat-persist-pglite:typescript:vanilla:chat:6187:false:pglite"
  "test-js-react-chat:javascript:react:chat:6188:false"
  "test-ts-react-chat:typescript:react:chat:6189:false"
  "test-ts-react-chat-schemas:typescript:react:chat:6190:true"
  "test-ts-react-chat-persist-sqlite:typescript:react:chat:6191:false:sqlite"
  "test-ts-react-chat-persist-pglite:typescript:react:chat:6192:false:pglite"
  "test-ts-react-chat-tinywidgets:typescript:react:chat:6234:false:local-storage:true"
  "test-js-solid-chat:javascript:solid:chat:6245:false"
  "test-ts-solid-chat:typescript:solid:chat:6246:false"
  "test-ts-solid-chat-schemas:typescript:solid:chat:6247:true"
  "test-ts-solid-chat-persist-sqlite:typescript:solid:chat:6248:false:sqlite"
  "test-ts-solid-chat-persist-pglite:typescript:solid:chat:6249:false:pglite"
  "test-js-svelte-chat:javascript:svelte:chat:6223:false"
  "test-ts-svelte-chat:typescript:svelte:chat:6224:false"
  "test-ts-svelte-chat-schemas:typescript:svelte:chat:6225:true"
  "test-ts-svelte-chat-persist-sqlite:typescript:svelte:chat:6226:false:sqlite"
  "test-ts-svelte-chat-persist-pglite:typescript:svelte:chat:6227:false:pglite"

  "test-js-vanilla-drawing:javascript:vanilla:drawing:6193:false"
  "test-ts-vanilla-drawing:typescript:vanilla:drawing:6194:false"
  "test-ts-vanilla-drawing-schemas:typescript:vanilla:drawing:6195:true"
  "test-ts-vanilla-drawing-persist-sqlite:typescript:vanilla:drawing:6196:false:sqlite"
  "test-ts-vanilla-drawing-persist-pglite:typescript:vanilla:drawing:6197:false:pglite"
  "test-js-react-drawing:javascript:react:drawing:6198:false"
  "test-ts-react-drawing:typescript:react:drawing:6199:false"
  "test-ts-react-drawing-schemas:typescript:react:drawing:6200:true"
  "test-ts-react-drawing-persist-sqlite:typescript:react:drawing:6201:false:sqlite"
  "test-ts-react-drawing-persist-pglite:typescript:react:drawing:6202:false:pglite"
  "test-ts-react-drawing-tinywidgets:typescript:react:drawing:6235:false:local-storage:true"
  "test-js-solid-drawing:javascript:solid:drawing:6250:false"
  "test-ts-solid-drawing:typescript:solid:drawing:6251:false"
  "test-ts-solid-drawing-schemas:typescript:solid:drawing:6252:true"
  "test-ts-solid-drawing-persist-sqlite:typescript:solid:drawing:6253:false:sqlite"
  "test-ts-solid-drawing-persist-pglite:typescript:solid:drawing:6254:false:pglite"
  "test-js-svelte-drawing:javascript:svelte:drawing:6218:false"
  "test-ts-svelte-drawing:typescript:svelte:drawing:6219:false"
  "test-ts-svelte-drawing-schemas:typescript:svelte:drawing:6220:true"
  "test-ts-svelte-drawing-persist-sqlite:typescript:svelte:drawing:6221:false:sqlite"
  "test-ts-svelte-drawing-persist-pglite:typescript:svelte:drawing:6222:false:pglite"

  "test-js-react-charting:javascript:react:charting:6260:false"
  "test-ts-react-charting:typescript:react:charting:6261:false"
  "test-ts-react-charting-schemas:typescript:react:charting:6262:true"
  "test-ts-react-charting-tinywidgets:typescript:react:charting:6263:false:local-storage:true"

  "test-js-vanilla-game:javascript:vanilla:game:6203:false"
  "test-ts-vanilla-game:typescript:vanilla:game:6204:false"
  "test-ts-vanilla-game-schemas:typescript:vanilla:game:6205:true"
  "test-ts-vanilla-game-persist-sqlite:typescript:vanilla:game:6206:false:sqlite"
  "test-ts-vanilla-game-persist-pglite:typescript:vanilla:game:6207:false:pglite"
  "test-js-react-game:javascript:react:game:6208:false"
  "test-ts-react-game:typescript:react:game:6209:false"
  "test-ts-react-game-schemas:typescript:react:game:6210:true"
  "test-ts-react-game-persist-sqlite:typescript:react:game:6211:false:sqlite"
  "test-ts-react-game-persist-pglite:typescript:react:game:6212:false:pglite"
  "test-ts-react-game-tinywidgets:typescript:react:game:6236:false:local-storage:true"
  "test-js-solid-game:javascript:solid:game:6255:false"
  "test-ts-solid-game:typescript:solid:game:6256:false"
  "test-ts-solid-game-schemas:typescript:solid:game:6257:true"
  "test-ts-solid-game-persist-sqlite:typescript:solid:game:6258:false:sqlite"
  "test-ts-solid-game-persist-pglite:typescript:solid:game:6259:false:pglite"
  "test-js-svelte-game:javascript:svelte:game:6228:false"
  "test-ts-svelte-game:typescript:svelte:game:6229:false"
  "test-ts-svelte-game-schemas:typescript:svelte:game:6230:true"
  "test-ts-svelte-game-persist-sqlite:typescript:svelte:game:6231:false:sqlite"
  "test-ts-svelte-game-persist-pglite:typescript:svelte:game:6232:false:pglite"
)

# Filter projects if requested
declare -a projects=()
if [ -n "$FILTER" ]; then
  echo "Filtering projects by: $FILTER"
  for project in "${all_projects[@]}"; do
    IFS=':' read -r name _ _ _ _ _ _ _ <<< "$project"
    if [[ "$name" == *"$FILTER"* ]]; then
      projects+=("$project")
    fi
  done
  if [ ${#projects[@]} -eq 0 ]; then
    echo "No projects match filter: $FILTER"
    exit 1
  fi
  echo "Building ${#projects[@]} project(s)"
else
  projects=("${all_projects[@]}")
  echo "Building all ${#projects[@]} projects"
fi

# Smart cleanup - preserve node_modules unless --clean is specified
if [ "$CLEAN" = true ]; then
  echo "Clean mode: removing tmp directory..."
  if [ -d "$TEST_DIR" ]; then
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR"
  fi
else
  echo "Smart mode: preserving node_modules where possible..."
  # For each project we're about to build, backup node_modules if it exists
  for project in "${projects[@]}"; do
    IFS=':' read -r name _ _ _ _ _ _ _ <<< "$project"
    project_path="$TEST_DIR/$name"
    if [ -d "$project_path" ]; then
      # Check for client/node_modules (new structure)
      if [ -d "$project_path/client/node_modules" ]; then
        echo "  Backing up node_modules for $name..."
        mv "$project_path/client/node_modules" "$TEST_DIR/.${name}-node_modules" 2>/dev/null || true
        if [ -f "$project_path/client/.package.json.cache" ]; then
          mv "$project_path/client/.package.json.cache" "$TEST_DIR/.${name}-cache" 2>/dev/null || true
        fi
      # Fallback to root node_modules (old structure)
      elif [ -d "$project_path/node_modules" ]; then
        echo "  Backing up node_modules for $name..."
        mv "$project_path/node_modules" "$TEST_DIR/.${name}-node_modules" 2>/dev/null || true
        if [ -f "$project_path/.package.json.cache" ]; then
          mv "$project_path/.package.json.cache" "$TEST_DIR/.${name}-cache" 2>/dev/null || true
        fi
      fi
      # Remove the project directory after backing up node_modules
      rm -rf "$project_path"
    fi
  done
fi

cd "$TEST_DIR"

echo "Creating projects..."
for project in "${projects[@]}"; do
  IFS=':' read -r name lang framework appType port schemas persistenceType tinyWidgets <<< "$project"
  # Default to local-storage if not specified
  persistenceType="${persistenceType:-local-storage}"
  tinyWidgets="${tinyWidgets:-false}"
  echo "Creating $name..."
  node "$CLI_PATH" \
    --non-interactive \
    --projectName "$name" \
    --language "$lang" \
    --framework "$framework" \
    --appType "$appType" \
    --schemas "$schemas" \
    --tinyWidgets "$tinyWidgets" \
    --prettier true \
    --eslint true \
    --persistenceType "$persistenceType"
  
  # Restore node_modules if we backed it up
  backup_path="$TEST_DIR/.${name}-node_modules"
  if [ -d "$backup_path" ]; then
    echo "  Restoring node_modules for $name..."
    # Check if we have a client/ subdirectory
    if [ -d "$name/client" ]; then
      mv "$backup_path" "$name/client/node_modules"
      cache_path="$TEST_DIR/.${name}-cache"
      if [ -f "$cache_path" ]; then
        mv "$cache_path" "$name/client/.package.json.cache"
      fi
    else
      mv "$backup_path" "$name/node_modules"
      cache_path="$TEST_DIR/.${name}-cache"
      if [ -f "$cache_path" ]; then
        mv "$cache_path" "$name/.package.json.cache"
      fi
    fi
  fi
done

# Smart npm install function
smart_install() {
  local name=$1
  local project_path="$TEST_DIR/$name"
  local install_path="$project_path"
  
  # Check if package.json is in client/ subdirectory
  if [ -f "$project_path/client/package.json" ]; then
    install_path="$project_path/client"
  fi
  
  # Check if we can skip install by comparing package.json
  if [ -f "$install_path/.package.json.cache" ] && [ -d "$install_path/node_modules" ]; then
    if cmp -s "$install_path/package.json" "$install_path/.package.json.cache"; then
      echo "  ⚡ Reusing node_modules for $name"
      return 0
    fi
  fi
  
  echo "Installing deps for $name..."
  (cd "$install_path" && npm install > "/tmp/${name}-install.log" 2>&1)
  
  # Cache the package.json
  cp "$install_path/package.json" "$install_path/.package.json.cache"
}

if [ "$SKIP_INSTALL" = false ]; then
  echo ""
  if [ "$PARALLEL_INSTALL" = true ]; then
    echo "Installing dependencies in parallel..."
    INSTALL_PIDS=()
    for project in "${projects[@]}"; do
      IFS=':' read -r name _ _ _ _ _ _ _ <<< "$project"
      smart_install "$name" &
      INSTALL_PIDS+=($!)
    done
    
    # Wait for all installs to complete
    for pid in "${INSTALL_PIDS[@]}"; do
      wait $pid
    done
    echo "All installs complete"
  else
    echo "Installing dependencies sequentially..."
    for project in "${projects[@]}"; do
      IFS=':' read -r name _ _ _ _ _ _ _ <<< "$project"
      smart_install "$name"
    done
  fi
else
  echo ""
  echo "Skipping npm install (using existing node_modules)"
fi

if [ "$BUILD_ONLY" = true ]; then
  echo ""
  echo "✅ Build complete! Projects created in $TEST_DIR"
  echo ""
  echo "Projects created:"
  for project in "${projects[@]}"; do
    IFS=':' read -r name _ _ _ _ _ _ _ <<< "$project"
    echo "  - $name"
  done
  exit 0
fi

echo ""
echo "Starting dev servers..."
PIDS=()
for project in "${projects[@]}"; do
  IFS=':' read -r name _ _ _ port _ _ _ <<< "$project"
  echo "Starting $name on port $port..."
  # Check if package.json is in client/ subdirectory
  if [ -f "$name/client/package.json" ]; then
    (cd "$name/client" && npm run dev -- --port "$port" --force > "/tmp/${name}.log" 2>&1) &
  else
    (cd "$name" && npm run dev -- --port "$port" --force > "/tmp/${name}.log" 2>&1) &
  fi
  PIDS+=($!)
done

echo ""
echo "Waiting for servers to start..."
sleep 2

echo ""
echo "Opening browsers..."
for project in "${projects[@]}"; do
  IFS=':' read -r name _ _ _ port _ _ _ <<< "$project"
  URL="http://localhost:$port"
  echo "Opening $name at $URL"
  open "$URL"
done

echo ""
echo "Projects running on ports:"
for project in "${projects[@]}"; do
  IFS=':' read -r name _ _ _ port _ _ _ <<< "$project"
  printf "  - %-25s http://localhost:%s\n" "$name:" "$port"
done
echo ""
echo "Press Ctrl+C to stop all servers and clean up"
echo ""

wait
