/** The install manifest: what this machine has, so the uninstall can remove it. */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { getRuntimePaths } from "../paths/index.js";

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
  const empty = { version: 1, installedAt: null, profile: null, mode: null, agents: [], dimensions: {}, surface: null, commands: null, entrypoint: null, global: null };

  try {
    const parsed = JSON.parse(readFileSync(manifestPath(), "utf8"));

    return { ...empty, ...parsed, agents: Array.isArray(parsed.agents) ? parsed.agents : [] };
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
export function recordInstall({ agent, mode, profile, dimensions, surface, commands, entrypoint, global, dryRun = false } = {}) {
  const manifest = readManifest();
  const agents = new Set(manifest.agents);

  if (agent && agent !== "all") {
    agents.add(agent);
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

  if (dryRun) {
    return { ...manifest, agents };
  }

  if (agents.length === 0) {
    rmSync(manifestPath(), { force: true });

    return { ...manifest, agents: [] };
  }

  const next = { ...manifest, agents };
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
export function writeInstalledManifest(agents, entrypoint, global, mode) {
  const list = Array.isArray(agents) ? agents : [agents];

  for (const agent of list) {
    recordInstall({ agent, mode, entrypoint, global, dimensions: { server: true } });
  }

  // The human-readable manifest beside the JSON one: the test and the doctor
  // both read the transport line, and an older release wrote only this file.
  const dataDir = join(process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share"), "rule-mcp");

  mkdirSync(dataDir, { recursive: true });
  writeFileSync(
    join(dataDir, "installed.md"),
    ["# rule-mcp", "", `- Transport: ${mode ?? "stdio"}`, `- Entrypoint: ${entrypoint ?? ""}`, `- Agents: ${list.join(", ")}`, ""].join("\n"),
  );

  return manifestPath();
}
