/**
 * @module cli/guard/send
 *
 * Thin client for the guard daemon: one connection, one NDJSON request, one
 * answer. Hosts still spawn this process per hook; the warm work stays in the
 * daemon.
 */

import net from "node:net";

import { guardSocketPath } from "./_socket.js";

/**
 * Send one request to the guard daemon and return the raw answer body (no
 * trailing newline).
 *
 * @param {{
 *   action: string,
 *   payload?: object,
 *   path?: string,
 *   timeoutMs?: number,
 * }} request
 * @returns {Promise<string>}
 */
export function sendGuardRequest(request) {
  const { action, payload = {}, path = guardSocketPath(), timeoutMs = 5_000 } = request;
  const line = `${JSON.stringify({ action, ...payload })}\n`;

  return new Promise((resolve, reject) => {
    const socket = net.connect(path);
    let buffer = "";
    let settled = false;

    const fail = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      reject(error);
    };

    const timer = setTimeout(() => fail(new Error("guard daemon timed out")), timeoutMs);

    socket.setEncoding("utf8");
    socket.on("connect", () => {
      socket.write(line);
    });
    socket.on("data", (chunk) => {
      buffer += chunk;

      const newline = buffer.indexOf("\n");

      if (newline === -1) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      socket.end();
      resolve(buffer.slice(0, newline));
    });
    socket.on("error", (error) => {
      clearTimeout(timer);
      fail(new Error(`guard daemon unavailable at ${path}: ${error.message}`));
    });
    socket.on("end", () => {
      if (settled) {
        return;
      }

      clearTimeout(timer);
      fail(new Error(`guard daemon closed without an answer (${path})`));
    });
  });
}

/**
 * Read stdin without importing `_run.js` (that module pulls inject/decide and
 * would make `--send` as expensive as a full guard spawn).
 *
 * @param {NodeJS.ReadStream} stream
 * @returns {Promise<string>}
 */
function readStdinLite(stream) {
  return new Promise((resolve) => {
    let data = "";

    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      data += chunk;
    });
    stream.on("end", () => resolve(data));
    stream.on("error", () => resolve(""));
  });
}

/**
 * CLI `--send`: read stdin as the payload (or `{}`), print the daemon answer.
 *
 * @param {string} action
 * @param {{
 *   stdin?: NodeJS.ReadStream,
 *   write?: (text: string) => void,
 * }} [io]
 * @returns {Promise<void>}
 */
export async function runGuardSend(action, io = {}) {
  const { stdin = process.stdin, write = (text) => process.stdout.write(text) } = io;
  let payload = {};

  if (!stdin.isTTY) {
    try {
      payload = JSON.parse(await readStdinLite(stdin)) ?? {};
    } catch {
      payload = {};
    }
  }

  const answer = await sendGuardRequest({ action, payload });

  write(answer);
}
