/** The on-disk record that the handoff was announced for a project, once per session. */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { getRuntimePaths } from "@mcp/cli/paths/index.js";

/** Where the record lives. Keyed by project, because two projects are two answers. */
function recordFile(cwd) {
  const key = createHash("sha256")

    .update(resolve(cwd ?? process.cwd()))
    .digest("hex")
    .slice(0, 16);

  return join(getRuntimePaths().stateDir, "resume", `${key}.json`);
}

/**
 * Record that the handoff was announced for this project, now.
 *
 * @param {string} [cwd]
 * @param {number} [at] - Epoch ms, for tests that need an older record
 */
export function markAnnounced(cwd, at = Date.now()) {
  const file = recordFile(cwd);

  try {
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(file, JSON.stringify({ at }), "utf8");
  } catch {
    /* a record that cannot be written costs a duplicate, never a crash */
  }
}

export { recordFile };
