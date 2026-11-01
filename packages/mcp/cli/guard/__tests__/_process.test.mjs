/** Detached guard daemon start/stop. */
import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

import { guardDaemonPaths, startGuardDaemonProcess, stopGuardDaemonProcess } from "../_process.js";
import { sendGuardRequest } from "../_send.js";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-guard-proc-"));

before(() => {
  process.env.RULE_MCP_HOME = home;
});

after(() => {
  stopGuardDaemonProcess();
  rmSync(home, { recursive: true, force: true });
});

test("start then --send works; stop clears the pid file", async () => {
  const first = startGuardDaemonProcess();

  assert.equal(first.ok, true);
  assert.ok(first.pid > 1);

  const deadline = Date.now() + 5_000;
  const { socketPath, pidFile } = guardDaemonPaths();

  while (!existsSync(socketPath) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  assert.ok(existsSync(socketPath), "socket appears");

  const answer = await sendGuardRequest({
    action: "prompt-submit",
    payload: { prompt: "proc", cwd: home },
  });

  assert.equal(JSON.parse(answer).hookSpecificOutput?.hookEventName, "UserPromptSubmit");

  const second = startGuardDaemonProcess();

  assert.equal(second.action, "already-running");

  const stopped = stopGuardDaemonProcess();

  assert.equal(stopped.ok, true);
  assert.equal(existsSync(pidFile), false);
});
