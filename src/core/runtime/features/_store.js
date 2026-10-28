/**
 * @module core/runtime/features/store
 *
 * Persist feature env keys to `~/.rule-mcp/config/env.json` (RULE_MCP_HOME).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { getRuntimePaths } from "../../../cli/paths/index.js";

/** Path of the switches file under the runtime home. */
export function envConfigPath(homeDir = getRuntimePaths().homeDir) {
  return join(homeDir, "config", "env.json");
}

/**
 * Read saved env keys, or `{}` when absent/unreadable.
 *
 * @param {{ homeDir?: string }} [options]
 * @returns {Record<string, string>}
 */
export function readSavedEnv({ homeDir } = {}) {
  const path = envConfigPath(homeDir ?? getRuntimePaths().homeDir);

  try {
    if (!existsSync(path)) {
      return {};
    }

    const parsed = JSON.parse(readFileSync(path, "utf8"));

    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Apply an env patch onto the saved file (`null` deletes the key).
 *
 * @param {Record<string, string|null>} patch
 * @param {{ homeDir?: string, dryRun?: boolean }} [options]
 * @returns {{ path: string, before: Record<string, string>, after: Record<string, string>, wrote: boolean }}
 */
export function applyEnvPatch(patch, { homeDir, dryRun = false } = {}) {
  const path = envConfigPath(homeDir ?? getRuntimePaths().homeDir);
  const before = readSavedEnv({ homeDir: homeDir ?? getRuntimePaths().homeDir });
  const after = { ...before };

  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined) {
      delete after[key];
    } else {
      after[key] = String(value);
    }
  }

  if (!dryRun) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(after, null, 2)}\n`, "utf8");
  }

  return { path, before, after, wrote: !dryRun };
}

/**
 * Env view used by readers: process.env over saved keys.
 *
 * @param {{ homeDir?: string, env?: NodeJS.ProcessEnv }} [options]
 * @returns {Record<string, string|undefined>}
 */
export function mergedEnv({ homeDir, env = process.env } = {}) {
  return { ...readSavedEnv({ homeDir }), ...env };
}
