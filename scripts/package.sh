#!/usr/bin/env bash
# Package the published rule-mcp product (packages/mcp) for npm, Homebrew, and
# direct download. The git root is rule-mcp-workspace; packing filters to the
# product package.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="rule-mcp"
VERSION=${1:-$(node -e "console.log(JSON.parse(require('fs').readFileSync('packages/mcp/package.json','utf8')).version)")}

echo "=== Packaging $NAME v$VERSION ==="

# 1. Embed skills
node "$ROOT/scripts/build/embed-skills/index.mjs"

# 2. Verify
if [ ! -f "$ROOT/bin/rule-mcp.js" ]; then
  echo "ERROR: bin/rule-mcp.js not found"
  exit 1
fi

# 3. Create npm tarball from the published package
echo "--- pnpm pack --filter rule-mcp ---"
cd "$ROOT"
pnpm pack --filter rule-mcp 2>/dev/null || echo "  pnpm pack skipped (use 'pnpm publish --filter rule-mcp' directly)"

# 4. Create Homebrew formula
echo "--- Homebrew formula ---"
SHASUM=$(shasum -a 256 "${NAME}-${VERSION}.tgz" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
cat > "${NAME}.rb" << FORMULA
class RuleMcp < Formula
  desc "MCP server for the rule-mcp-* skill ecosystem"
  homepage "https://github.com/pixu1980/rule-mcp"
  url "https://github.com/pixu1980/rule-mcp/releases/download/v${VERSION}/${NAME}-${VERSION}.tgz"
  sha256 "${SHASUM}"
  license "MIT"

  depends_on "node"

  def install
    libexec.install Dir["*"]
    bin.install_symlink libexec/"bin/rule-mcp.js" => "rule-mcp"
  end

  test do
    system "#{bin}/rule", "doctor"
  end
end
FORMULA
echo "  Formula: ${NAME}.rb (sha256: ${SHASUM})"

# 5. Install scripts are NOT generated here. They are tracked bootstraps
# (ADR 080): the single installer implementation lives in packages/mcp/cli/setup/
# and the shell scripts only forward to it. Regenerating them from
# heredocs reintroduced the registry install and the drift this removed.

echo "=== Done ==="
echo ""
echo "Publish to Homebrew:"
echo "  gh release upload v$VERSION ${NAME}.rb"
