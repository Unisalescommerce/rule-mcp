/**
 * @module cli/install/manifest-hosts
 *
 * The per-host half of the install manifest: the level each host was installed at,
 * the human-readable summary beside the JSON one, and the one place a host is
 * forgotten.
 *
 * Split from `_manifest.js` because the two halves answer different questions -
 * what this machine has, and what it has per host.
 */

import { rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";


import { forgetInstall, readManifest } from "./_manifest-store.js";

/** The path of the human-readable manifest written beside the JSON one. */
export function readmePath() {
  return join(process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share"), "rule-mcp", "installed.md");
}

/**
 * Forget one host, and delete both manifests once nothing is left to describe.
 *
 * An uninstall that leaves the manifests behind leaves a doctor reporting hosts
 * that no longer exist, which is the report a user reads right after removing
 * them. Both files go together: they are two views of one fact.
 *
 * @param {{ agent?: string, dryRun?: boolean }} entry
 * @returns {{ agents: string[], removed: boolean }}
 */
export function forgetHost({ agent, dryRun = false } = {}) {
  const next = forgetInstall({ agent, dryRun });
  const removed = next.agents.length === 0;

  if (removed && !dryRun) {
    rmSync(readmePath(), { force: true });
  }

  return { agents: next.agents, removed };
}

/**
 * The level each recorded host was installed at, or null when the entry carries
 * none.
 *
 * One function, because `/rule-init` and `doctor` both report it: two readers
 * computing the same fact from the same file is how a report starts disagreeing
 * with itself.
 *
 * @returns {Record<string, string|null>}
 */
export function hostLevels() {
  return Object.fromEntries(Object.entries(readManifest().hosts ?? {}).map(([id, host]) => [id, host.level ?? null]));
}
