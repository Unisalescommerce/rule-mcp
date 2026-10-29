/** The install manifest: what this machine has, so the uninstall can remove it. */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { getRuntimePaths } from "../paths/index.js";
import { readmePath } from "./_manifest-hosts.js";
import { MANIFEST_VERSION, manifestPath, readManifest } from "./_manifest-store.js";

export * from "./_manifest-hosts.js";

export { MANIFEST_VERSION, forgetInstall, manifestPath, readManifest } from "./_manifest-store.js";

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

/** Whether a manifest exists on this machine. */
export function hasManifest() {
  return existsSync(manifestPath());
}
