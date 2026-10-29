/**
@module test/setup/task-launcher

The plan step: the copy is installed, the pointer names it, and the size is on
screen. A deploy that fails warns and moves on - an install that stops halfway
because 85 MB could not be written leaves the rest of the machine unconfigured,
which is worse than a launcher that is one command away from working.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { dirBytes, launcherTask, sizeText } from "../_task-launcher.js";
import { currentVersion, launcherRoot } from "../_launcher-install.js";

const root = mkdtempSync(join(tmpdir(), "rule-task-launcher-"));

process.env.RULE_MCP_HOME = root;

test.after(() => rmSync(root, { recursive: true, force: true }));

const runner = (command, args) => {
  const target = args.at(-1);

  mkdirSync(join(target, "bin"), { recursive: true });
  writeFileSync(join(target, "bin/rule-mcp.js"), "// entry\n");
  writeFileSync(join(target, "payload.bin"), Buffer.alloc(2 * 1_048_576));

  return { stdout: `${command}\n` };
};

test("the step installs the copy and reports its size", () => {
  const task = launcherTask({ checkout: "/tmp/checkout", version: "1.0.0", run: runner, probe: () => ({ ok: true }) });
  const result = task.run({ dryRun: false });

  assert.equal(task.id, "launcher");
  assert.equal(result.status, "ok");
  assert.equal(result.summary, "1.0.0 - 2 MB", `the size travels with the row: ${result.summary}`);
  assert.deepEqual(result.lines, ["current: 1.0.0"]);
  assert.equal(currentVersion(), "1.0.0");
});

test("a second run verifies instead of deploying again", () => {
  const task = launcherTask({ checkout: "/tmp/checkout", version: "1.0.0", run: runner, probe: () => ({ ok: true }) });
  const result = task.run({ dryRun: false });

  assert.equal(result.summary, "1.0.0 verified");
});

test("a dry run says where it would put the copy and writes nothing", () => {
  const before = currentVersion();
  const task = launcherTask({ checkout: "/tmp/checkout", version: "9.9.9", run: runner, probe: () => ({ ok: true }) });
  const result = task.run({ dryRun: true });

  assert.ok(result.summary.startsWith("would deploy 9.9.9 to"), result.summary);
  assert.equal(currentVersion(), before);
});

test("a failed deploy warns with the reason and names the repair", () => {
  const task = launcherTask({
    checkout: "/tmp/checkout",
    version: "2.0.0",
    run: () => {
      throw new Error("pnpm: command not found");
    },
  });
  const result = task.run({ dryRun: false });

  assert.equal(result.status, "warn");
  assert.match(result.summary, /pnpm: command not found/u);
  assert.match(result.lines[0], /rule-mcp setup/u);
});

test("the size helpers answer for a directory and for a small one", () => {
  assert.ok(dirBytes(launcherRoot()) > 0);
  assert.equal(sizeText(0), "0 MB");
  assert.equal(dirBytes(join(root, "nope")), 0);
});
