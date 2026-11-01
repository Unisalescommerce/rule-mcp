/**
 * @module cli/guard/loop
 *
 * Persistent guard: one warm process, many NDJSON requests on stdin.
 * Each line is `{ "action": "<kind>", ...payload }`. Each response is one
 * JSON object followed by a newline. Hosts still spawn per hook until they
 * are rewired to this entry; the loop exists so that rewire can be measured.
 */

import { createInterface } from "node:readline";

import { runGuard } from "./_run.js";

/**
 * @param {{
 *   stdin?: NodeJS.ReadStream,
 *   write?: (text: string) => void,
 *   defaultAction?: string,
 * }} [io]
 * @returns {Promise<void>}
 */
export async function runGuardLoop(io = {}) {
  const { stdin = process.stdin, write = (text) => process.stdout.write(text), defaultAction = "bash" } = io;
  const lines = createInterface({ input: stdin, crlfDelay: Infinity });

  for await (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      continue;
    }

    let message;

    try {
      message = JSON.parse(trimmed);
    } catch {
      write(`${JSON.stringify({ error: "unparseable" })}\n`);
      continue;
    }

    const action = message.action ?? message.kind ?? defaultAction;
    const { action: _a, kind: _k, ...payload } = message;

    let body = "";

    await runGuard(action, {
      payload,
      write: (text) => {
        body += text;
      },
    });
    write(`${body}\n`);
  }
}
