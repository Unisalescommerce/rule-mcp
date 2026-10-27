/**
 * @module cli/guard/daemon
 *
 * One warm guard process listening on a Unix socket. Each connection is one
 * NDJSON request (`{ "action", ...payload }`) and one JSON answer line.
 */

import { mkdirSync, unlinkSync } from "node:fs";
import net from "node:net";
import { dirname } from "node:path";

import { runGuard } from "./_run.js";
import { guardSocketPath } from "./_socket.js";

/**
 * @param {string} line
 * @returns {Promise<string>}
 */
async function answerLine(line) {
  let message;

  try {
    message = JSON.parse(line);
  } catch {
    return `${JSON.stringify({ error: "unparseable" })}\n`;
  }

  const action = message.action ?? message.kind ?? "bash";
  const { action: _a, kind: _k, ...payload } = message;
  let body = "";

  await runGuard(action, {
    payload,
    write: (text) => {
      body += text;
    },
  });

  return `${body}\n`;
}

/**
 * Start the guard daemon. Resolves when listening. Call `close()` to stop.
 *
 * @param {{ path?: string, defaultAction?: string }} [options]
 * @returns {Promise<{ path: string, close: () => Promise<void> }>}
 */
export async function startGuardDaemon(options = {}) {
  const path = options.path ?? guardSocketPath();

  mkdirSync(dirname(path), { recursive: true });

  try {
    unlinkSync(path);
  } catch {
    /* no stale socket */
  }

  const server = net.createServer((socket) => {
    let buffer = "";

    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      buffer += chunk;

      const newline = buffer.indexOf("\n");

      if (newline === -1) {
        return;
      }

      const line = buffer.slice(0, newline).trim();

      buffer = buffer.slice(newline + 1);
      answerLine(line)
        .then((answer) => {
          socket.end(answer);
        })
        .catch(() => {
          socket.end(`${JSON.stringify({ error: "guard-failed" })}\n`);
        });
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(path, resolve);
  });

  return {
    path,
    close: () =>
      new Promise((resolve) => {
        server.close(() => {
          try {
            unlinkSync(path);
          } catch {
            /* already gone */
          }
          resolve();
        });
      }),
  };
}

/**
 * Block forever serving the guard socket (CLI `--daemon`).
 *
 * @returns {Promise<void>}
 */
export async function runGuardDaemon() {
  const daemon = await startGuardDaemon();

  await new Promise(() => {
    /* listen until the process is killed */
  });

  await daemon.close();
}
