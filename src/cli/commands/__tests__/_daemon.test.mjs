/**
 * @module test/daemon.test
 *
 * TDD tests for the daemon command.
 * Tests that daemon start/stop/status/logs work with the SSE transport.
 */

// eslint-disable-next-line no-unused-vars
import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readFileSync, unlinkSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * A free loopback port, asked of the kernel rather than assumed.
 *
 * The daemon is a real process on a real port. While this test hardcoded 37999
 * and the user's own home, a parallel suite could answer the health check for
 * it - the port was shared with the daemon of whoever ran the tests.
 *
 * @returns {Promise<number>}
 */
async function freePort() {
  const server = createServer();

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));

  return port;
}

// Before anything imports the paths: a daemon of its own, on a port of its own.
process.env.RULE_MCP_HOME = mkdtempSync(join(tmpdir(), "rule-mcp-daemon-test-"));
process.env.RULE_MCP_PORT = String(await freePort());
process.env.RULE_MCP_NO_AUTOUPDATE = "1";

let pass = 0;
let fail = 0;
const check = (label, ok) => {
  if (ok) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    console.log(`  ❌ ${label}`);
  }
};

console.log("=== Daemon Command Tests ===\n");

/** Poll the health endpoint until the daemon answers, or give up. */
async function waitForHealth({ timeoutMs = 15000, stepMs = 200 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last = null;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${daemonPort}/health`);

      if (res.status === 200) {
        return res;
      }

      last = res;
    } catch (error) {
      last = error;
    }

    await new Promise((r) => setTimeout(r, stepMs));
  }

  throw new Error(`the daemon never answered on ${daemonPort}: ${last}`);
}

/** Poll until nothing answers on the daemon port, or give up. */
async function waitForClosed({ timeoutMs = 5000, stepMs = 200 } = {}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      await fetch(`http://127.0.0.1:${daemonPort}/health`);
    } catch {
      return;
    }

    await new Promise((r) => setTimeout(r, stepMs));
  }

  throw new Error(`something still answers on ${daemonPort} after stop`);
}

const { getRuntimePaths } = await import("../../paths/index.js");
const { rmSync } = await import("node:fs");

process.on("exit", () => rmSync(process.env.RULE_MCP_HOME, { recursive: true, force: true }));

const paths = getRuntimePaths();
const daemonPort = process.env.RULE_MCP_PORT;
const pidFile = paths.pidFile;
const logFile = paths.logFile;

// Clean up any stale state
try {
  unlinkSync(pidFile);
} catch {
  /* ignore: pid file may be absent */
}
try {
  unlinkSync(logFile);
} catch {
  /* ignore: log file may be absent */
}

// ── Import the daemon command handler ──
const { daemonCommand } = await import("../index.js");
const { daemonProcessStatus } = await import("../../daemon/_process-status.js");

// ── T7: daemon start creates pid file and starts server ──
await daemonCommand({ action: "start" });
const pidExists = existsSync(pidFile);
check("T7 daemon start creates pid file", pidExists);

if (pidExists) {
  const pid = Number(readFileSync(pidFile, "utf8").trim());
  check("T7.1 pid file contains valid number", !isNaN(pid) && pid > 0);

  // Check the process is actually running
  try {
    process.kill(pid, 0);
    check("T7.2 daemon process is running", true);
  } catch {
    check("T7.2 daemon process is running", false);
  }

  // Wait for the daemon to answer, rather than for a fixed slice of time: a
  // machine running the whole suite gives the child less of the CPU, and a
  // 2 s sleep made this test fail on load instead of on behavior.
  try {
    const res = await waitForHealth();

    check("T7.3 daemon health endpoint responds", res.status === 200);
    const body = await res.json();
    check("T7.4 daemon reports ok:true", body.ok === true);
  } catch (error) {
    check("T7.3 daemon health endpoint responds", false);
    console.log("       Error:", error.message);
  }
}

// ── T8: daemon status reflects the live process (human table is decorative) ──
const statusLive = daemonProcessStatus();
check("T8 daemon status reports running", statusLive.running === true);
check("T8.1 status includes pid", Number.isInteger(statusLive.pid));

// ── T9: daemon stop removes pid file and stops server ──
await daemonCommand({ action: "stop" });
check("T9 daemon stop removes pid file", !existsSync(pidFile));

try {
  await waitForClosed();

  check("T9.1 daemon port closed after stop", true);
} catch (error) {
  check("T9.1 daemon port closed after stop", false);
  console.log("       Error:", error.message);
}

// ── T8.2: daemon status reports not running after stop (covered at T9) ──

console.log(`\nResults: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
