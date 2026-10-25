/** @module cli/install/detect - which hosts have the server configured */

import { existsSync, readFileSync } from "node:fs";

import { allAgents } from "../installers/index.js";
import { hostRecord } from "../installers/hosts/index.js";
import { serverName } from "../installers/_paths.js";

export * from "../installers/index.js";

/**
 * Detect which hosts have rule-mcp configured.
 *
 * One row per catalog host, answered by the host record: the file the install
 * writes today first, then the files earlier releases wrote, so an install that
 * has not been migrated is still found. When nothing contains the server, the
 * row still names the documented file, because a host that is installed but not
 * configured is a different report from a host that is absent.
 *
 * @returns {Array<{ name: string, configured: boolean, configFile: string|null }>}
 */
export function detectInstalledAgents() {
  return allAgents.map((name) => {
    const record = hostRecord(name);
    const paths = record ? [record.server.file, ...record.legacy] : [];
    const key = record?.key ?? serverName;
    const found = paths.find((file) => existsSync(file) && readFileSync(file, "utf8").includes(key));

    return { name, configured: Boolean(found), configFile: found ?? paths[0] ?? null };
  });
}

/**
 * Get all supported agent names.
 * @returns {string[]}
 */
export function getAllAgents() {
  return [...allAgents];
}
