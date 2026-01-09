#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

TEST_DIR="$PROJECT_ROOT/tmp"
CLI_PATH="$PROJECT_ROOT/dist/cli.js"

if [ -d "$TEST_DIR" ]; then
  rm -rf "$TEST_DIR"
fi

mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

declare -a projects=(
  "test-js-vanilla:javascript:vanilla:5173"
  "test-js-react:javascript:react:5174"
  "test-ts-vanilla:typescript:vanilla:5175"
  "test-ts-react:typescript:react:5176"
)

echo "Creating projects..."
for project in "${projects[@]}"; do
  IFS=':' read -r name lang framework port <<< "$project"
  echo "Creating $name..."
  node "$CLI_PATH" \
    --non-interactive \
    --projectName "$name" \
    --language "$lang" \
    --framework "$framework" \
    --prettier false \
    --eslint false
done

echo ""
echo "Installing dependencies..."
for project in "${projects[@]}"; do
  IFS=':' read -r name _ _ _ <<< "$project"
  echo "Installing deps for $name..."
  (cd "$name" && npm install > /dev/null 2>&1)
done

echo ""
echo "Starting dev servers..."
PIDS=()
for project in "${projects[@]}"; do
  IFS=':' read -r name _ _ port <<< "$project"
  echo "Starting $name on port $port..."
  (cd "$name" && npm run dev -- --port "$port" > "/tmp/${name}.log" 2>&1) &
  PIDS+=($!)
done

echo ""
echo "Waiting for servers to start (3 seconds)..."
sleep 3

echo ""
echo "Opening browsers..."
for project in "${projects[@]}"; do
  IFS=':' read -r name _ _ port <<< "$project"
  URL="http://localhost:$port"
  echo "Opening $name at $URL"
  open "$URL"
  sleep 1
done

echo ""
echo "=== All servers running ==="
echo "Projects running on ports:"
echo "  - test-js-vanilla:  http://localhost:5173"
echo "  - test-js-react:    http://localhost:5174"
echo "  - test-ts-vanilla:  http://localhost:5175"
echo "  - test-ts-react:    http://localhost:5176"
echo ""
echo "Press Ctrl+C to stop all servers and clean up"
echo ""

trap 'echo ""; echo "Stopping servers..."; kill ${PIDS[@]} 2>/dev/null; exit 0' INT

wait
