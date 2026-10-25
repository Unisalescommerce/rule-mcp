/**
 * @module test/installers/host-non-installable
 *
 * Phase 4's gate: the products the study measured that no install can target
 * write nothing, and say why instead of failing as if the name were a typo.
 *
 * The distinction matters to a reader. `install --agent aidr` is a mistake;
 * `install --agent aider` is a product nobody found a config file for, and the
 * second answer has to be a fact, not the list of the 23 that do work.
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { allAgents } from "../../src/cli/installers/index.js";
import { evidenceOf, nonInstallable } from "../../src/cli/installers/hosts/_evidence.data.js";
import { hostRecord } from "../../src/cli/installers/hosts/index.js";

const ALIAS_HOOK = fileURLToPath(new URL("../../scripts/alias-hook.mjs", import.meta.url));
const ROOT = fileURLToPath(new URL("../..", import.meta.url));

const run = (args, home) =>
  execFileSync(process.execPath, ["--import", ALIAS_HOOK, "bin/rule-mcp.js", ...args], { cwd: ROOT, env: { ...process.env, HOME: home }, encoding: "utf8", stdio: "pipe" });

test("the measured products are exactly the ones with no installer row", () => {
  const measured = nonInstallable()
    .map((row) => row.id)
    .sort();

  assert.deepEqual(measured, ["aider", "amp", "continue", "cursor-cli", "goose", "junie", "openhands", "trae"], "the eight the study measured without a target");
  assert.deepEqual(
    allAgents.filter((id) => measured.includes(id)),
    [],
    "and none of them is installable",
  );
});

test("every one of them carries a reason, and a covered one names its owner", () => {
  for (const row of nonInstallable()) {
    assert.ok(row.reason.trim().length > 20, `${row.id}: a reason a reader can act on`);

    if (row.coveredBy) {
      assert.ok(allAgents.includes(row.coveredBy), `${row.id}: covered by ${row.coveredBy}, which is not installable either`);
      assert.equal(hostRecord(row.id), null, `${row.id}: a covered product is not its own record`);
    }
  }

  assert.equal(evidenceOf("cursor-cli").coveredBy, "cursor", "the CLI reads the editor's config, so one install covers both");
});

test("installing a measured product writes nothing and refuses with its reason", () => {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-noninstallable-"));

  try {
    let failure;

    try {
      run(["install", "--agent", "aider", "--no-wizard"], home);
    } catch (error) {
      failure = error;
    }

    assert.ok(failure, "the install must not succeed");
    assert.equal(failure.status, 1, "a refusal exits non-zero");
    assert.match(String(failure.stderr), /"aider" cannot be installed: no documented MCP config file was found/u, "the message is the finding");
    assert.deepEqual(readdirSync(home), [], "and nothing was written, not even a directory");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("a name nobody measured is still an unsupported name", () => {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-noninstallable-"));

  try {
    let failure;

    try {
      run(["install", "--agent", "aidr", "--no-wizard"], home);
    } catch (error) {
      failure = error;
    }

    assert.match(String(failure.stderr), /Unsupported agent: "aidr"/u, "a typo is a typo");
    assert.doesNotMatch(String(failure.stderr), /cannot be installed/u, "and it is not reported as a measured product");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
