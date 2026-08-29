#!/usr/bin/env bash
# SessionStart hook: make sure the project is ready to run/typecheck in a
# fresh Claude Code web session (dependencies installed).
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ ! -d node_modules ] || [ ! -d node_modules/expo ]; then
  echo "[session-start] Installing dependencies…"
  npm install --no-audit --no-fund >/dev/null 2>&1 || npm install
  echo "[session-start] Dependencies ready."
else
  echo "[session-start] Dependencies already present."
fi
