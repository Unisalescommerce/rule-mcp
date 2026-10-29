/** The manifest file itself: where it lives, what it says, and the two store primitives. */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getRuntimePaths } from "../paths/index.js";

/** The manifest schema this tree writes. A v1 file is read as v2, never rewritten on read. */
export const MANIFEST_VERSION = 2;

/** The manifest file sits in the runtime config directory. */
export function manifestPath() {
  return join(getRuntimePaths().configDir, "install.json");
}

/**
 * Read the manifest, or an empty one when this machine never wrote it.
 *
 * @returns {{ version: number, installedAt: string|null, mode: string|null, agents: string[], dimensions: object }}
 */
export function readManifest() {
  const empty = {
    version: MANIFEST_VERSION,
    installedAt: null,
    profile: null,
    mode: null,
    agents: [],
    hosts: {},
    dimensions: {},
    surface: null,
    commands: null,
    entrypoint: null,
    global: null,
    migrated: false,
  };

  try {
    const parsed = JSON.parse(readFileSync(manifestPath(), "utf8"));
    const agents = Array.isArray(parsed.agents) ? parsed.agents : [];

    // A v1 manifest records the hosts it installed and nothing about them. The
    // level is the one fact the doctor needs and the one a v1 file cannot answer,
    // so the migration reads the file as v2 with `level: null` for each host
    // rather than inventing one: `null` says "installed before the manifest knew".
    const hosts = parsed.hosts ?? Object.fromEntries(agents.map((agent) => [agent, { level: null }]));

    return { ...empty, ...parsed, version: MANIFEST_VERSION, agents, hosts, migrated: parsed.version !== MANIFEST_VERSION };
  } catch {
    return empty;
  }
}

/** Remove one agent from the manifest; delete the file once nothing is left. */
export function forgetInstall({ agent, dryRun = false } = {}) {
  const manifest = readManifest();
  const agents = manifest.agents.filter((entry) => entry !== agent);
  const hosts = Object.fromEntries(Object.entries(manifest.hosts).filter(([id]) => id !== agent));

  if (dryRun) {
    return { ...manifest, agents, hosts };
  }

  if (agents.length === 0) {
    rmSync(manifestPath(), { force: true });

    return { ...manifest, agents: [], hosts: {} };
  }

  const next = { ...manifest, agents, hosts };

  writeFileSync(manifestPath(), `${JSON.stringify(next, null, 2)}\n`);

  return next;
}
