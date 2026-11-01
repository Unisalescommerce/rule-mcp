#!/usr/bin/env bash
# Materialize ../nyx from scripts/ci/nyx-stub when the sibling checkout is absent.
# CI and Docker call this so `workspace:*` resolves; RULE_MCP_NO_NYX=1 keeps the
# stub from answering as a real engine.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SIBLING="$(cd "$ROOT/.." && pwd)/nyx"
STUB="$ROOT/scripts/ci/nyx-stub"

if [[ -f "$SIBLING/package.json" ]]; then
  name="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).name)" "$SIBLING/package.json" 2>/dev/null || true)"
  if [[ "$name" == "nyx-gateway" ]]; then
    echo "nyx-stub: using sibling checkout at $SIBLING"
    exit 0
  fi
fi

mkdir -p "$SIBLING"
# Copy stub files without clobbering an unrelated directory that lacks the package.
cp -R "$STUB/." "$SIBLING/"
echo "nyx-stub: wrote stub package at $SIBLING (set RULE_MCP_NO_NYX=1)"
