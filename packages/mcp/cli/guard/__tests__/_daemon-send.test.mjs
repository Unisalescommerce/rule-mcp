/** Guard socket daemon + --send client: one warm process, many short clients. */
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

import { guardSocketPath } from "../_socket.js";
import { startGuardDaemon } from "../_daemon.js";
import { sendGuardRequest } from "../_send.js";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-guard-sock-"));

before(() => {
  process.env.RULE_MCP_HOME = home;
});

after(() => {
  rmSync(home, { recursive: true, force: true });
});

test("guardSocketPath lives under RULE_MCP_HOME state", () => {
  assert.equal(guardSocketPath(), join(home, "state", "guard.sock"));
});

test("daemon answers two --send clients without a lingering hang", async () => {
  const daemon = await startGuardDaemon();

  try {
    const first = await sendGuardRequest({
      action: "prompt-submit",
      payload: { prompt: "one", cwd: home },
    });
    const second = await sendGuardRequest({
      action: "prompt-submit",
      payload: { prompt: "two", cwd: home },
    });

    assert.equal(JSON.parse(first).hookSpecificOutput?.hookEventName, "UserPromptSubmit");
    assert.equal(JSON.parse(second).hookSpecificOutput?.hookEventName, "UserPromptSubmit");
  } finally {
    await daemon.close();
  }
});

test("send fails clearly when the daemon is down", async () => {
  await assert.rejects(() => sendGuardRequest({ action: "prompt-submit", payload: {} }), /guard daemon/i);
});

test("bin early-dispatch guard --send reaches the daemon", async () => {
  const { spawn } = await import("node:child_process");
  const { once } = await import("node:events");
  const bin = new URL("../../../../../bin/rule-mcp.js", import.meta.url).pathname;
  // Daemon must be a sibling process: execFileSync in this process would block
  // the event loop and the in-process server could never answer.
  const daemon = spawn(process.execPath, [bin, "guard", "--daemon"], {
    env: process.env,
    stdio: "ignore",
  });

  const { existsSync } = await import("node:fs");
  const sock = guardSocketPath();
  const deadline = Date.now() + 5_000;

  while (!existsSync(sock) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  assert.ok(existsSync(sock), "daemon socket appears");

  try {
    const child = spawn(process.execPath, [bin, "guard", "--send", "prompt-submit"], {
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    child.stdin.end(JSON.stringify({ prompt: "bin", cwd: home }));

    let out = "";
    let err = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      out += chunk;
    });
    child.stderr.on("data", (chunk) => {
      err += chunk;
    });

    const [code] = await once(child, "close");

    assert.equal(code, 0, `--send exits 0 (stderr=${err})`);
    assert.equal(JSON.parse(out).hookSpecificOutput?.hookEventName, "UserPromptSubmit");
  } finally {
    daemon.kill("SIGTERM");
  }
});
