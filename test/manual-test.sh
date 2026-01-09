#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

TEST_DIR="$PROJECT_ROOT/tmp"
CLI_PATH="$PROJECT_ROOT/dist/cli.js"

cleanup() {
  echo ""
  echo "Stopping servers..."
  pkill -P $$ 2>/dev/null || true
  kill ${PIDS[@]} 2>/dev/null || true
  pkill -f "vite.*--port.*517[3-6]" 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM EXIT

echo "Cleaning up any previous servers..."
pkill -f "vite.*--port.*517[3-6]" 2>/dev/null || true

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
  (cd "$name" && npm run dev -- --port "$port" --force > "/tmp/${name}.log" 2>&1) &
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
echo "Projects running on ports:"
for project in "${projects[@]}"; do
  IFS=':' read -r name _ _ port <<< "$project"
  printf "  - %-18s http://localhost:%s\n" "$name:" "$port"
done
echo ""
echo "Press Ctrl+C to stop all servers and clean up"
echo ""

wait
