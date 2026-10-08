#!/usr/bin/env bash
# Starts the whole app with one command:
#   backend  (FastAPI)  -> http://localhost:8000   (API docs: /docs)
#   frontend (Next.js)  -> http://localhost:3000
#
# Usage:
#   ./start.sh           install what's missing, then run both servers
#   ./start.sh --reset   same, but wipe the database and reload the demo data first
#
# Press Ctrl+C to stop both servers.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

say() { printf "\033[1;35m▶\033[0m %s\n" "$1"; }
fail() { printf "\033[1;31m✖ %s\033[0m\n" "$1"; exit 1; }

# --- 1. Check the tools we need ------------------------------------------------
command -v python3 >/dev/null || fail "python3 is not installed (need Python 3.10+)."
command -v npm >/dev/null || fail "npm is not installed (need Node.js 20.9+)."
python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' || fail "Python 3.10+ is required."
node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>20||(a===20&&b>=9)?0:1)' \
  || fail "Node.js 20.9+ is required (found $(node -v))."

for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "Port $port is already in use. Stop that process first (lsof -i :$port)."
  fi
done

# --- 2. Backend setup ------------------------------------------------------------
cd "$BACKEND"
if [ ! -d .venv ]; then
  say "Creating Python virtual environment (backend/.venv)..."
  python3 -m venv .venv
fi
# Re-install packages only when requirements.txt changed since the last install.
if [ ! -f .venv/.installed ] || [ requirements.txt -nt .venv/.installed ]; then
  say "Installing backend packages..."
  .venv/bin/pip install --quiet --upgrade pip
  .venv/bin/pip install --quiet -r requirements.txt
  touch .venv/.installed
fi
if [ "${1:-}" = "--reset" ]; then
  say "Resetting the database with demo data..."
  .venv/bin/python -m app.seed
fi
# (If the database is empty, the backend seeds demo data by itself on startup.)

# --- 3. Frontend setup -----------------------------------------------------------
cd "$FRONTEND"
if [ ! -d node_modules ]; then
  say "Installing frontend packages (first run takes a minute)..."
  npm install --no-audit --no-fund
fi
if [ ! -f .env.local ]; then
  echo "NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT" > .env.local
fi

# --- 4. Run both servers; Ctrl+C stops everything ---------------------------------
trap 'trap - INT TERM EXIT; echo; say "Stopping servers..."; kill 0 2>/dev/null' INT TERM EXIT

say "Starting backend on http://localhost:$BACKEND_PORT ..."
(cd "$BACKEND" && exec .venv/bin/uvicorn app.main:app --reload --port "$BACKEND_PORT") &

# Wait until the API answers before starting the frontend.
for _ in $(seq 1 60); do
  curl -sf "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -sf "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1 || fail "Backend did not start. See the log above."

say "Starting frontend on http://localhost:$FRONTEND_PORT ..."
(cd "$FRONTEND" && exec npx next dev --port "$FRONTEND_PORT") &

cat <<INFO

  App:       http://localhost:$FRONTEND_PORT
  API docs:  http://localhost:$BACKEND_PORT/docs
  Demo logins (no password): guest@demo.com  ·  host@demo.com

  Press Ctrl+C to stop both servers.

INFO

wait
