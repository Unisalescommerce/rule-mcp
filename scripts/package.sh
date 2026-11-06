#!/usr/bin/env bash
# Build the release asset: the committed tree as one gzip tarball.
#
# The server needs bin/, skills/, personas/, prompts/ and scripts/ beside the
# workspace packages, and an install needs the lockfile, so the asset is the
# source tree and not a pack of one package. `pnpm install --frozen-lockfile`
# inside the extracted tree builds the workspace. No registry is involved.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="rule-mcp"
VERSION=${1:-$(node -p "JSON.parse(require('fs').readFileSync('$ROOT/package.json', 'utf8')).version")}
OUT="$ROOT/dist"

node "$ROOT/scripts/build/embed-skills/index.mjs"

mkdir -p "$OUT"
git -C "$ROOT" archive --format=tar.gz --prefix="${NAME}-${VERSION}/" -o "$OUT/${NAME}-${VERSION}.tgz" HEAD

echo "Wrote dist/${NAME}-${VERSION}.tgz"
