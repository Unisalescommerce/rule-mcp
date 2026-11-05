/**
@module test/hooks/repo-hooks-fallback

The repository's own tracked hooks probe the launcher instead of trusting
`command -v`.

`command -v` passes for a launcher whose target moved: a checkout on another
branch, a copy that was pruned, a broken binary. The hook then runs it under
`set -e`, node exits 1, and the push is blocked with `Cannot find module` - the
failure this repository has already met once, when exit 1 from node read as "the
validator found violations". The hooks fall back to the in-repo validator when the
launcher does not answer, and the fallback is the point: the gate stays on.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const repo = new URL("../../..", import.meta.url).pathname;
const hooks = ["commit-msg", "pre-commit", "pre-push"];

/** A launcher that exists, cannot run, and says so the way node does. */
const brokenLauncher = (dir) => {
  const path = join(dir, "rule-mcp");

  writeFileSync(path, ["#!/bin/sh", 'echo "Error: Cannot find module" >&2', "exit 1", ""].join("\n"));
  chmodSync(path, 0o755);
};

/** A launcher that answers the probe and records that it was asked. */
const workingLauncher = (dir) => {
  const path = join(dir, "rule-mcp");

  writeFileSync(path, ["#!/bin/sh", 'if [ "$1" = "--version" ]; then echo 0.1.0; exit 0; fi', `echo "$@" >> ${JSON.stringify(join(dir, "calls.log"))}`, "exit 0", ""].join("\n"));
  chmodSync(path, 0o755);
};

/** Run one hook with a PATH holding only the temp dir and the system. */
function run({ launcherDir }) {
  const message = join(launcherDir, "msg.txt");

  writeFileSync(message, "feat(hooks): a subject\n");

  return spawnSync("sh", [join(repo, ".githooks", "commit-msg"), message], {
    cwd: repo,
    encoding: "utf8",
    input: "",
    env: { ...process.env, PATH: `${launcherDir}:${dirname(process.execPath)}:/usr/bin:/bin` },
  });
}

test("every gate hook probes the launcher before trusting it", () => {
  for (const hook of hooks) {
    const body = readFileSync(join(repo, ".githooks", hook), "utf8");

    assert.match(body, /rule-mcp --version/u, `${hook} must ask whether the launcher answers, not whether it exists`);
  }
});

test("a broken launcher falls back to the in-repo validator instead of blocking", () => {
  const dir = mkdtempSync(join(tmpdir(), "rule-hook-fallback-"));

  brokenLauncher(dir);

  const result = run({ launcherDir: dir });

  assert.equal(result.status, 0, `a broken launcher must not block a valid message: ${result.stderr}`);
  assert.doesNotMatch(result.stderr, /Cannot find module/u, "and the reader never sees node's error");
});

test("a working launcher is still the one that runs", () => {
  const dir = mkdtempSync(join(tmpdir(), "rule-hook-working-"));

  workingLauncher(dir);

  const result = run({ launcherDir: dir });
  const calls = readFileSync(join(dir, "calls.log"), "utf8");

  assert.equal(result.status, 0);
  assert.match(calls, /commit-lint --msg-file/u, "the binary answers when it can");
});
