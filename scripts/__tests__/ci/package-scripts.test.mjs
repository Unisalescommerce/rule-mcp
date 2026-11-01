import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// `pnpm uninstall` and the local `uninstall` script share a name, and only one
// of them can win. `uninstall` is a pnpm builtin alias for `remove`, so the bare
// form never reaches a script: pnpm answers "At least one dependency name
// should be specified for removal" before a script is considered. The script is
// reachable as `pnpm run uninstall`, and these tests keep it pointing at the
// checkout's own entry point, so it works without a global install.

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

test("the uninstall script runs the CLI command from this checkout", () => {
  const script = manifest.scripts?.uninstall;

  assert.equal(script, "node ./bin/rule-mcp.js uninstall", "the script must call the checkout's entry point, not a global shim");
  assert.ok(existsSync(join(root, "bin/rule-mcp.js")), "the entry point the script names must exist");
});

test("the same name is a pnpm builtin, so the script needs `run`", () => {
  const [[binName, binPath]] = Object.entries(manifest.bin ?? {});
  const entry = manifest.scripts.uninstall.split(" ").at(-2);

  assert.equal(binName, "rule-mcp", "the package exposes one binary, and that is the name the user types");
  assert.equal(binPath.replace(/^\.\//u, ""), entry.replace(/^\.\//u, ""), "`rule-mcp uninstall` and `pnpm run uninstall` must be the same entry point");
});
