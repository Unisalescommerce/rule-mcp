/** The install manifest: what this machine has, so the uninstall can remove it. */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname } from "node:path";
import { join } from "node:path";

import { getRuntimePaths } from "../paths/index.js";
import { readmePath } from "./_manifest-hosts.js";

export * from "./_manifest-hosts.js";

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

/**
 * Merge one install into the manifest and write it.
 *
 * `dimensions` is the map the uninstall reads, so it carries install
 * dimensions only (`server`, `rules`, `commands`, `hooks`, `doctor`).
 * `entrypoint` and `global` describe how the entry was written and live beside
 * it: putting them in the map made the uninstaller offer "entrypoint" as
 * something to remove.
 *
 * @param {{ agent?: string, mode?: string, profile?: string, dimensions?: object, surface?: object|null, commands?: object|null, entrypoint?: string, global?: boolean, dryRun?: boolean }} entry
 * @returns {object} the manifest as written
 */
export function recordInstall({ agent, level = null, mode, profile, dimensions, surface, commands, entrypoint, global, written, dryRun = false } = {}) {
  const manifest = readManifest();
  const agents = new Set(manifest.agents);
  const hosts = { ...manifest.hosts };

  if (agent && agent !== "all") {
    agents.add(agent);
    const prior = hosts[agent] ?? {};
    const mergedWritten = [...new Set([...(prior.written ?? []), ...(written ?? [])])].sort();

    hosts[agent] = {
      level: level ?? prior.level ?? null,
      ...(mergedWritten.length > 0 ? { written: mergedWritten } : prior.written ? { written: prior.written } : {}),
    };
  }

  const next = {
    ...manifest,
    installedAt: new Date().toISOString(),
    mode: mode ?? manifest.mode,
    profile: profile ?? manifest.profile,
    surface: surface ?? manifest.surface,
    commands: commands ?? manifest.commands,
    entrypoint: entrypoint ?? manifest.entrypoint,
    global: global ?? manifest.global,
    agents: [...agents].sort(),
    hosts,
    version: MANIFEST_VERSION,
    dimensions: dimensions ? { ...manifest.dimensions, ...dimensions } : manifest.dimensions,
  };

  if (!dryRun) {
    mkdirSync(getRuntimePaths().configDir, { recursive: true });
    writeFileSync(manifestPath(), `${JSON.stringify(next, null, 2)}\n`);
  }

  return next;
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

/** Whether a manifest exists on this machine. */
export function hasManifest() {
  return existsSync(manifestPath());
}

/**
 * Record one install and return the manifest path (the agent-ops caller
 * reports it in its result).
 *
 * @param {string|string[]} agents
 * @param {string} [entrypoint]
 * @param {boolean} [global]
 * @param {string} [mode]
 * @returns {string}
 */
export function writeInstalledManifest(agents, entrypoint, global, mode, level = null) {
  const list = Array.isArray(agents) ? agents : [agents];

  for (const agent of list) {
    recordInstall({ agent, level, mode, entrypoint, global, dimensions: { server: true } });
  }

  // The human-readable manifest beside the JSON one: the test and the doctor
  // both read the transport line, and an older release wrote only this file.
  mkdirSync(dirname(readmePath()), { recursive: true });
  writeFileSync(readmePath(), ["# rule-mcp", "", `- Transport: ${mode ?? "stdio"}`, `- Entrypoint: ${entrypoint ?? ""}`, `- Agents: ${list.join(", ")}`, ""].join("\n"));

  return manifestPath();
}
