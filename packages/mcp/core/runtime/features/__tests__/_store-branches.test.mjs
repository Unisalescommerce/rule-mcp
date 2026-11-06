/** A saved env file that is not a map reads as empty, and the home has a default. */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { withHome } from "rule-mcp-shared";

import { applyEnvPatch, envConfigPath, readSavedEnv } from "../_store.js";

for (const [name, body] of [
  ["an array", "[1]"],
  ["broken JSON", "{broken"],
  ["null", "null"],
]) {
  test(`${name} in the saved file reads as no variables`, (t) => {
    const homeDir = mkdtempSync(join(tmpdir(), "rule-mcp-env-store-"));
    const path = envConfigPath(homeDir);

    t.after(() => rmSync(homeDir, { recursive: true, force: true }));
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);

    assert.deepEqual(readSavedEnv({ homeDir }), {});
  });
}

test("a dry run on the default home writes nothing", () => {
  withHome(() => {
    applyEnvPatch({ RULE_MCP_NO_CACHE: "1" }, { dryRun: true });

    assert.deepEqual(readSavedEnv(), {});
  });
});
