/**
 * @module core/runtime/features/apply
 *
 * Set a feature to a level, persist it, and optionally refresh installs.
 */

import { envPatchFor, defaultLevel, levelsFor } from "./_catalog.data.js";
import { readLevel } from "./_readers.js";
import { applyEnvPatch, mergedEnv } from "./_store.js";

/**
 * Normalize a requested level: `enable` defaults to the first non-off level;
 * `disable` maps to `off` when that level exists, else the last level.
 *
 * @param {string} id
 * @param {"enable"|"disable"|string} actionOrLevel
 * @returns {string}
 */
export function resolveRequestedLevel(id, actionOrLevel) {
  const levels = levelsFor(id);

  if (actionOrLevel === "enable") {
    return levels.find((level) => level !== "off") ?? defaultLevel(id);
  }

  if (actionOrLevel === "disable") {
    return levels.includes("off") ? "off" : levels.at(-1);
  }

  if (!levels.includes(actionOrLevel)) {
    throw new Error(`Unknown level "${actionOrLevel}" for feature ${id} (want ${levels.join("|")})`);
  }

  return actionOrLevel;
}

/**
 * Write one feature level into env.json.
 *
 * @param {string} id
 * @param {string} levelOrAction
 * @param {{ homeDir?: string, dryRun?: boolean, env?: NodeJS.ProcessEnv }} [options]
 * @returns {{
 *   id: string,
 *   level: string,
 *   previous: string,
 *   path: string,
 *   patch: Record<string, string|null>,
 *   wrote: boolean,
 * }}
 */
export function setFeatureLevel(id, levelOrAction, { homeDir, dryRun = false, env } = {}) {
  const level = resolveRequestedLevel(id, levelOrAction);
  const view = mergedEnv({ homeDir, env });
  const previous = readLevel(id, view);
  const patch = envPatchFor(id, level);
  const result = applyEnvPatch(patch, { homeDir, dryRun });

  return {
    id,
    level,
    previous,
    path: result.path,
    patch,
    wrote: result.wrote,
  };
}

/**
 * Parse `id=level` pairs from `--feature` flags.
 *
 * @param {string[]} specs
 * @returns {Array<{ id: string, level: string }>}
 */
export function parseFeatureSpecs(specs = []) {
  return specs.map((spec) => {
    const eq = spec.indexOf("=");

    if (eq < 1) {
      throw new Error(`Invalid --feature "${spec}": use id=level`);
    }

    const id = spec.slice(0, eq).trim();
    const level = spec.slice(eq + 1).trim();

    resolveRequestedLevel(id, level);

    return { id, level };
  });
}
