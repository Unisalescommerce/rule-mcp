/**
The pre-commit gate: only a finding blocks.

`rule-mcp secrets` answers with three exits - 0 clean, 1 credentials found, 2
the scan did not run - and the hook has to keep them apart. A missing
betterleaks, a broken one or a patch over the 4 MiB cap is reported and
stepped over: a gate that blocks every commit until somebody repairs a tool
teaches `--no-verify`, and that habit outlives the tool. A finding is the one
answer that stops the commit.
*/
import { strict as assert } from "node:assert";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

const repo = new URL("../../..", import.meta.url).pathname;

/** A launcher that answers the probe, records the call, and exits `code`. */
function launcher(dir, code) {
  const path = join(dir, "rule-mcp");

  writeFileSync(
    path,
    ["#!/bin/sh", 'if [ "$1" = "--version" ]; then echo 0.1.0; exit 0; fi', `echo "$@" >> ${JSON.stringify(join(dir, "calls.log"))}`, `exit ${code}`, ""].join("\n"),
  );
  chmodSync(path, 0o755);
}

/** Run the tracked hook with a PATH holding the fake launcher and the system. */
function runHook(dir) {
  return spawnSync("sh", [join(repo, ".githooks", "pre-commit")], {
    cwd: repo,
    encoding: "utf8",
    input: "",
    env: { ...process.env, PATH: `${dir}:${dirname(process.execPath)}:/usr/bin:/bin`, RULE_MCP_HOOK_NO_SIDE_EFFECTS: "1" },
  });
}

test("a clean scan passes the commit through", () => {
  const dir = mkdtempSync(join(tmpdir(), "rule-pre-commit-clean-"));

  launcher(dir, 0);
  const result = runHook(dir);

  assert.equal(result.status, 0, result.stderr);
  assert.match(readFileSync(join(dir, "calls.log"), "utf8"), /^secrets$/mu, "the hook runs the secrets command");
});

test("a finding blocks the commit", () => {
  const dir = mkdtempSync(join(tmpdir(), "rule-pre-commit-found-"));

  launcher(dir, 1);
  const result = runHook(dir);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /rejected - credentials/u);
  assert.match(result.stderr, /Rotate anything that is real/u);
});

test("a scan that did not run is reported and does not block", () => {
  const dir = mkdtempSync(join(tmpdir(), "rule-pre-commit-skip-"));

  launcher(dir, 2);
  const result = runHook(dir);

  assert.equal(result.status, 0, "a broken tool must not become a blocked commit");
  assert.match(result.stderr, /did not run \(exit 2\); not blocking/u);
});
