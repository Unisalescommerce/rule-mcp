/**
 * @module cli/guard/process
 *
 * Detached lifecycle for the guard Unix-socket daemon. Mirrors the MCP daemon
 * helpers but runs `guard --daemon` and uses its own pid/log files so the two
 * residents do not share a lock.
 */

import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { getRuntimePaths } from "../paths/_runtime.js";
import { isAlive } from "../daemon/_process-status.js";
import { rotateDaemonLog } from "../daemon/_process.js";
import { guardSocketPath } from "./_socket.js";

/**
 * @returns {{ pidFile: string, logFile: string, socketPath: string }}
 */
export function guardDaemonPaths() {
  const { stateDir } = getRuntimePaths();

  return {
    pidFile: join(stateDir, "guard.pid"),
    logFile: join(stateDir, "guard.log"),
    socketPath: guardSocketPath(),
  };
}

/** Absolute node + bin for `guard --daemon`. */
function guardDaemonCommand() {
  const script = fileURLToPath(new URL("../../../../bin/rule-mcp.js", import.meta.url));

  return { node: process.execPath, args: [script, "guard", "--daemon"] };
}

/**
 * Spawn the guard daemon in the background if it is not already running.
 *
 * @param {{ dryRun?: boolean }} [opts]
 * @returns {{ ok: boolean, pid: number|null, action: string }}
 */
export function startGuardDaemonProcess({ dryRun = false } = {}) {
  const paths = guardDaemonPaths();

  mkdirSync(getRuntimePaths().stateDir, { recursive: true });

  if (existsSync(paths.pidFile)) {
    const pid = Number(readFileSync(paths.pidFile, "utf8").trim());

    if (Number.isInteger(pid) && pid > 1 && isAlive(pid)) {
      return { ok: true, pid, action: "already-running" };
    }

    rmSync(paths.pidFile, { force: true });
  }

  if (dryRun) {
    return { ok: true, pid: null, action: "dry-run (would spawn guard daemon)" };
  }

  rotateDaemonLog(paths.logFile);

  const { node, args } = guardDaemonCommand();
  const logFd = openSync(paths.logFile, "a", 0o600);
  let child;

  try {
    child = spawn(node, args, {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: { ...process.env, RULE_MCP_GUARD_DAEMON: "1" },
    });
  } finally {
    closeSync(logFd);
  }

  child.unref();
  writeFileSync(paths.pidFile, String(child.pid));

  return { ok: true, pid: child.pid, action: "started" };
}

/**
 * Stop the background guard daemon (sync so install/uninstall stay sync).
 *
 * @param {{ dryRun?: boolean }} [opts]
 * @returns {{ ok: boolean, action: string }}
 */
export function stopGuardDaemonProcess({ dryRun = false } = {}) {
  const paths = guardDaemonPaths();

  if (!existsSync(paths.pidFile)) {
    return { ok: true, action: "not-running" };
  }

  if (dryRun) {
    return { ok: true, action: "dry-run (would stop guard daemon)" };
  }

  const pid = Number(readFileSync(paths.pidFile, "utf8").trim());

  if (!Number.isInteger(pid) || pid <= 1 || !isAlive(pid)) {
    rmSync(paths.pidFile, { force: true });
    rmSync(paths.socketPath, { force: true });

    return { ok: true, action: "already-gone" };
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    rmSync(paths.pidFile, { force: true });
    rmSync(paths.socketPath, { force: true });

    return { ok: true, action: "already-gone" };
  }

  const deadline = Date.now() + 3_000;

  while (Date.now() < deadline && isAlive(pid)) {
    /* wait for graceful exit */
  }

  if (isAlive(pid)) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      return { ok: false, action: "still-running" };
    }
  }

  rmSync(paths.pidFile, { force: true });
  rmSync(paths.socketPath, { force: true });

  return { ok: true, action: isAlive(pid) ? "still-running" : "stopped" };
}
