/**
@module cli/setup/launcher-store
 *
 * What the launcher keeps on disk: one directory per version, a pointer file
 * naming the one in use, and a record of what this installer wrote.
 *
 * The pointer is a plain word on purpose. A rollback is then an edit - `1.0.0`
 * in a file - and not a reinstall, which matters at the moment a release turns
 * out to be the wrong one.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Where the copies live: `~/.rule-mcp/launcher/`. */
export const launcherRoot = ({ homeDir = homedir() } = {}) => join(homeDir, ".rule-mcp", "launcher");

/** The pointer file, and the record beside it. */
const CURRENT = "current";
const RECORD = "installed.json";

/**
 * The version the pointer names, if the pointer is readable.
 *
 * @param {{ homeDir?: string }} [options]
 * @returns {string|undefined}
 */
export function currentVersion({ homeDir = homedir() } = {}) {
  const file = join(launcherRoot({ homeDir }), CURRENT);

  if (!existsSync(file)) {
    return undefined;
  }

  try {
    return readFileSync(file, "utf8").trim() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Point the launcher at a version.
 *
 * @param {{ homeDir?: string, version: string, dryRun?: boolean }} options
 * @returns {string|undefined} the path written
 */
export function setCurrent({ homeDir = homedir(), version, dryRun = false }) {
  const root = launcherRoot({ homeDir });
  const file = join(root, CURRENT);

  if (dryRun) {
    return file;
  }

  mkdirSync(root, { recursive: true });
  writeFileSync(file, `${version}\n`);

  return file;
}

/**
 * The copies this installer wrote, oldest first.
 *
 * The record is the truth, not the directories: a directory nobody recorded is a
 * copy this installer cannot vouch for, and a launcher trusts only what it wrote.
 *
 * @param {{ homeDir?: string }} [options]
 * @returns {Array<{ version: string, source: string, installedAt: string }>}
 */
export function installedVersions({ homeDir = homedir() } = {}) {
  const file = join(launcherRoot({ homeDir }), RECORD);

  if (!existsSync(file)) {
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Record one installed version, replacing any row for the same version.
 *
 * @param {{ homeDir?: string, row: object }} options
 */
export function recordVersion({ homeDir = homedir(), row }) {
  const root = launcherRoot({ homeDir });
  const rows = installedVersions({ homeDir }).filter((entry) => entry.version !== row.version);

  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, RECORD), `${JSON.stringify([...rows, row], null, 2)}\n`);
}

/**
 * Drop every recorded row whose version is not kept.
 *
 * The record and the directories prune together: a row for a copy that is gone
 * describes a launcher nobody can run.
 *
 * @param {{ homeDir?: string, keep: string[] }} options
 */
export function recordPrune({ homeDir = homedir(), keep }) {
  const rows = installedVersions({ homeDir }).filter((row) => keep.includes(row.version));

  if (rows.length > 0) {
    writeFileSync(join(launcherRoot({ homeDir }), RECORD), `${JSON.stringify(rows, null, 2)}\n`);
  }
}

/**
 * Remove the copies the record does not name any more.
 *
 * @param {{ homeDir?: string, keep: string[] }} options
 * @returns {string[]} the directories removed
 */
export function pruneVersions({ homeDir = homedir(), keep }) {
  const root = launcherRoot({ homeDir });

  if (!existsSync(root)) {
    return [];
  }

  const removed = [];

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || keep.includes(entry.name)) {
      continue;
    }

    rmSync(join(root, entry.name), { recursive: true, force: true });
    removed.push(entry.name);
  }

  return removed;
}
