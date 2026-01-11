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

while [[ $# -gt 0 ]]; do
  case $1 in
    --filter)
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
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --filter PATTERN    Only build projects matching pattern (e.g., 'chat', 'ts-react', 'drawing')"
      echo "  --skip-install      Skip npm install (assumes deps already installed)"
      echo "  --no-parallel       Install dependencies sequentially instead of in parallel"
      echo "  --clean             Clean tmp directory (force fresh install)"
      echo "  --help              Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                           # Build all 12 projects (reuse node_modules)"
      echo "  $0 --filter chat             # Build only chat projects"
      echo "  $0 --filter ts-react-chat    # Build only ts-react-chat"
      echo "  $0 --filter drawing --skip-install  # Build drawing projects, skip install"
      echo "  $0 --clean                   # Force fresh install for all projects"
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
  pkill -f "vite.*--port.*51[7-8][0-9]" 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM EXIT

echo "Cleaning up any previous servers..."
pkill -f "vite.*--port.*51[7-8][0-9]" 2>/dev/null || true

mkdir -p "$TEST_DIR"

declare -a all_projects=(
  "test-js-vanilla-todos:javascript:vanilla:todos:5173"
  "test-js-react-todos:javascript:react:todos:5174"
  "test-ts-vanilla-todos:typescript:vanilla:todos:5175"
  "test-ts-react-todos:typescript:react:todos:5176"
  "test-js-vanilla-chat:javascript:vanilla:chat:5177"
  "test-js-react-chat:javascript:react:chat:5178"
  "test-ts-vanilla-chat:typescript:vanilla:chat:5179"
  "test-ts-react-chat:typescript:react:chat:5180"
  "test-js-vanilla-drawing:javascript:vanilla:drawing:5181"
  "test-js-react-drawing:javascript:react:drawing:5182"
  "test-ts-vanilla-drawing:typescript:vanilla:drawing:5183"
  "test-ts-react-drawing:typescript:react:drawing:5184"
  "test-js-vanilla-game:javascript:vanilla:game:5185"
  "test-js-react-game:javascript:react:game:5186"
  "test-ts-vanilla-game:typescript:vanilla:game:5187"
  "test-ts-react-game:typescript:react:game:5188"
)

# Filter projects if requested
declare -a projects=()
if [ -n "$FILTER" ]; then
  echo "Filtering projects by: $FILTER"
  for project in "${all_projects[@]}"; do
    IFS=':' read -r name _ _ _ _ <<< "$project"
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
    IFS=':' read -r name _ _ _ _ <<< "$project"
    project_path="$TEST_DIR/$name"
    if [ -d "$project_path" ]; then
      if [ -d "$project_path/node_modules" ]; then
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
  IFS=':' read -r name lang framework appType port <<< "$project"
  echo "Creating $name..."
  node "$CLI_PATH" \
    --non-interactive \
    --projectName "$name" \
    --language "$lang" \
    --framework "$framework" \
    --appType "$appType" \
    --prettier false \
    --eslint false
  
  # Restore node_modules if we backed it up
  backup_path="$TEST_DIR/.${name}-node_modules"
  if [ -d "$backup_path" ]; then
    echo "  Restoring node_modules for $name..."
    mv "$backup_path" "$name/node_modules"
    cache_path="$TEST_DIR/.${name}-cache"
    if [ -f "$cache_path" ]; then
      mv "$cache_path" "$name/.package.json.cache"
    fi
  fi
done

# Smart npm install function
smart_install() {
  local name=$1
  local project_path="$TEST_DIR/$name"
  
  # Check if we can skip install by comparing package.json
  if [ -f "$project_path/.package.json.cache" ] && [ -d "$project_path/node_modules" ]; then
    if cmp -s "$project_path/package.json" "$project_path/.package.json.cache"; then
      echo "  ⚡ Reusing node_modules for $name"
      return 0
    fi
  fi
  
  echo "Installing deps for $name..."
  (cd "$project_path" && npm install > "/tmp/${name}-install.log" 2>&1)
  
  # Cache the package.json
  cp "$project_path/package.json" "$project_path/.package.json.cache"
}

if [ "$SKIP_INSTALL" = false ]; then
  echo ""
  if [ "$PARALLEL_INSTALL" = true ]; then
    echo "Installing dependencies in parallel..."
    INSTALL_PIDS=()
    for project in "${projects[@]}"; do
      IFS=':' read -r name _ _ _ _ <<< "$project"
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
      IFS=':' read -r name _ _ _ _ <<< "$project"
      smart_install "$name"
    done
  fi
else
  echo ""
  echo "Skipping npm install (using existing node_modules)"
fi

echo ""
echo "Starting dev servers..."
PIDS=()
for project in "${projects[@]}"; do
  IFS=':' read -r name _ _ _ port <<< "$project"
  echo "Starting $name on port $port..."
  (cd "$name" && npm run dev -- --port "$port" --force > "/tmp/${name}.log" 2>&1) &
  PIDS+=($!)
done

echo ""
echo "Waiting for servers to start (1 second)..."
sleep 1

echo ""
echo "Opening browsers..."
for project in "${projects[@]}"; do
  IFS=':' read -r name _ _ _ port <<< "$project"
  URL="http://localhost:$port"
  echo "Opening $name at $URL"
  open "$URL"
  sleep 1
done

echo ""
echo "Projects running on ports:"
for project in "${projects[@]}"; do
  IFS=':' read -r name _ _ _ port <<< "$project"
  printf "  - %-25s http://localhost:%s\n" "$name:" "$port"
done
echo ""
echo "Press Ctrl+C to stop all servers and clean up"
echo ""

wait
