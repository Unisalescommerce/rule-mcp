/** The bulk manifest write: a whole selection in one pass, plus its README. */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { manifestPath, recordInstall } from "./_manifest.js";
import { readmePath } from "./_manifest-hosts.js";

/**
 * Write the manifest for a whole selection, plus the human-readable README
 * beside it, and answer the JSON path.
 *
 * The README is not decoration: the test and the doctor both read the transport
 * line, and an older release wrote only this file.
 *
 * @param {string|string[]} agents
 * @param {string} [entrypoint]
 * @param {boolean} [global]
 * @param {string} [mode]
 * @param {string|null} [level]
 * @returns {string}
 */
export function writeInstalledManifest(agents, entrypoint, global, mode, level = null) {
  const list = Array.isArray(agents) ? agents : [agents];

  for (const agent of list) {
    recordInstall({ agent, level, mode, entrypoint, global, dimensions: { server: true } });
  }

  mkdirSync(dirname(readmePath()), { recursive: true });
  writeFileSync(readmePath(), ["# rule-mcp", "", `- Transport: ${mode ?? "stdio"}`, `- Entrypoint: ${entrypoint ?? ""}`, `- Agents: ${list.join(", ")}`, ""].join("\n"));

  return manifestPath();
}
