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
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --filter PATTERN    Only build projects matching pattern (e.g., 'chat', 'ts-react', 'drawing')"
      echo "  --skip-install      Skip npm install (assumes deps already installed)"
      echo "  --no-parallel       Install dependencies sequentially instead of in parallel"
      echo "  --help              Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                           # Build all 12 projects"
      echo "  $0 --filter chat             # Build only chat projects"
      echo "  $0 --filter ts-react-chat    # Build only ts-react-chat"
      echo "  $0 --filter drawing --skip-install  # Build drawing projects, skip install"
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

if [ -d "$TEST_DIR" ]; then
  rm -rf "$TEST_DIR"
fi

mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

declare -a all_projects=(
  "test-js-vanilla-basic:javascript:vanilla:basic:5173"
  "test-js-react-basic:javascript:react:basic:5174"
  "test-ts-vanilla-basic:typescript:vanilla:basic:5175"
  "test-ts-react-basic:typescript:react:basic:5176"
  "test-js-vanilla-chat:javascript:vanilla:chat:5177"
  "test-js-react-chat:javascript:react:chat:5178"
  "test-ts-vanilla-chat:typescript:vanilla:chat:5179"
  "test-ts-react-chat:typescript:react:chat:5180"
  "test-js-vanilla-drawing:javascript:vanilla:drawing:5181"
  "test-js-react-drawing:javascript:react:drawing:5182"
  "test-ts-vanilla-drawing:typescript:vanilla:drawing:5183"
  "test-ts-react-drawing:typescript:react:drawing:5184"
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
done

if [ "$SKIP_INSTALL" = false ]; then
  echo ""
  if [ "$PARALLEL_INSTALL" = true ]; then
    echo "Installing dependencies in parallel..."
    INSTALL_PIDS=()
    for project in "${projects[@]}"; do
      IFS=':' read -r name _ _ _ _ <<< "$project"
      echo "Installing deps for $name..."
      (cd "$name" && npm install > "/tmp/${name}-install.log" 2>&1) &
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
      echo "Installing deps for $name..."
      (cd "$name" && npm install > /dev/null 2>&1)
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
echo "Waiting for servers to start (3 seconds)..."
sleep 3

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
