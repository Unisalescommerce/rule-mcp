/**
@module cli/setup/launcher-prune
 *
 * Keeping one copy: the directories the record does not name any more go, and
 * their rows go with them.
 *
 * A second copy is a second thing to trust and a second thing to get out of date,
 * for no gain. A row without a directory describes a launcher nobody can run, so
 * the record prunes in the same step.
 */

import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getRuntimePaths } from "../paths/index.js";
import { installedVersions, launcherRoot } from "./_launcher-store.js";

const RECORD = "installed.json";

/**
 * Drop every recorded row whose version is not kept.
 *
 * The record and the directories prune together: a row for a copy that is gone
 * describes a launcher nobody can run.
 *
 * @param {{ root?: string, keep: string[] }} options
 */
export function recordPrune({ root = getRuntimePaths().homeDir, keep }) {
  const dir = launcherRoot({ root });
  const rows = installedVersions({ root }).filter((row) => keep.includes(row.version));
  const file = join(dir, RECORD);

  if (rows.length === 0) {
    if (existsSync(file)) {
      rmSync(file, { force: true });
    }

    return;
  }

  writeFileSync(file, `${JSON.stringify(rows, null, 2)}\n`);
}

/**
 * Remove the copies the record does not name any more.
 *
 * @param {{ root?: string, keep: string[] }} options
 * @returns {string[]} the directories removed
 */
export function pruneVersions({ root = getRuntimePaths().homeDir, keep }) {
  const dir = launcherRoot({ root });

  if (!existsSync(dir)) {
    return [];
  }

  const removed = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || keep.includes(entry.name)) {
      continue;
    }

    rmSync(join(dir, entry.name), { recursive: true, force: true });
    removed.push(entry.name);
  }

  return removed;
}
