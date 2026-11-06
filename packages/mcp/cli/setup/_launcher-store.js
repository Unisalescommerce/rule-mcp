/**
@module cli/setup/launcher-store
 *
 * What the launcher keeps on disk: one directory per version, a pointer file
 * naming the one in use, and a record of what this installer wrote.
 *
 * The pointer is a plain word on purpose. A rollback is then an edit - `1.0.0`
 * in a file - and not a reinstall, which matters at the moment a release turns
 * out to be the wrong one.
 *
 * Everything is keyed on the runtime root, not on a home directory: `RULE_MCP_HOME`
 * relocates the whole tree, and a launcher that ignored it would install into the
 * real home during a test.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getRuntimePaths } from "../paths/index.js";

/** The pointer file, and the record beside it. */
const CURRENT = "current";
const RECORD = "installed.json";

/**
 * Where the copies live: `launcher/` under the runtime root.
 *
 * @param {{ root?: string }} [options]
 * @returns {string}
 */
export const launcherRoot = ({ root = getRuntimePaths().homeDir } = {}) => join(root, "launcher");

/**
 * The version the pointer names, if the pointer is readable.
 *
 * @param {{ root?: string }} [options]
 * @returns {string|undefined}
 */
export function currentVersion({ root = getRuntimePaths().homeDir } = {}) {
  const file = join(launcherRoot({ root }), CURRENT);

  if (!existsSync(file)) {
    return;
  }

  try {
    return readFileSync(file, "utf8").trim() || undefined;
  } catch {
    return;
  }
}

/**
 * Point the launcher at a version.
 *
 * @param {{ root?: string, version: string, dryRun?: boolean }} options
 * @returns {string|undefined} the path written
 */
export function setCurrent({ root = getRuntimePaths().homeDir, version, dryRun = false }) {
  const dir = launcherRoot({ root });
  const file = join(dir, CURRENT);

  if (dryRun) {
    return file;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(file, `${version}\n`);

  return file;
}

/**
 * The copies this installer wrote, oldest first.
 *
 * The record is the truth, not the directories: a directory nobody recorded is a
 * copy this installer cannot vouch for, and a launcher trusts only what it wrote.
 *
 * @param {{ root?: string }} [options]
 * @returns {Array<{ version: string, source: string, installedAt: string }>}
 */
export function installedVersions({ root = getRuntimePaths().homeDir } = {}) {
  const file = join(launcherRoot({ root }), RECORD);

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
 * @param {{ root?: string, row: object }} options
 */
export function recordVersion({ root = getRuntimePaths().homeDir, row }) {
  const dir = launcherRoot({ root });
  const rows = installedVersions({ root }).filter((entry) => entry.version !== row.version);

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, RECORD), `${JSON.stringify([...rows, row], null, 2)}\n`);
}
