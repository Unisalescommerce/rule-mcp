/**
 * @module core/runtime/features/readers
 *
 * Read each feature's current level back from env (including legacy keys).
 */

import { hasTokensave } from "../../detector/index.js";
import { FEATURES, defaultLevel, levelsFor } from "./_catalog.data.js";

/**
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} env
 * @param {string} key
 * @returns {string|undefined}
 */
const get = (env, key) => {
  const value = env[key];

  return value === undefined || value === "" ? undefined : value;
};

/**
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} env
 * @returns {string}
 */
function readAdr(env) {
  return get(env, "RULE_MCP_NO_ADR") === "1" ? "off" : "on";
}

/**
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} env
 * @returns {string}
 */
function readTelemetry(env) {
  if (get(env, "RULE_MCP_NO_TELEMETRY") === "1") {
    return "off";
  }

  if (get(env, "RULE_MCP_TELEMETRY_ANONYMOUS") === "1" || get(env, "RULE_MCP_NO_PROMPTS") === "1") {
    return "anonymous";
  }

  return "full";
}

/**
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} env
 * @returns {string}
 */
function readUpdate(env) {
  if (get(env, "RULE_MCP_NO_AUTOUPDATE") === "1") {
    return "off";
  }

  return get(env, "RULE_MCP_AUTO_UPDATE") === "merge" ? "auto" : "notify";
}

/**
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} env
 * @param {{ projectDir?: string }} [options]
 * @returns {string}
 */
function readTokensave(env, { projectDir } = {}) {
  if (get(env, "RULE_MCP_NO_TOKENSAVE") === "1") {
    return "off";
  }

  if (get(env, "RULE_MCP_TOKENSAVE_AUTOTRACK") === "1") {
    return "autotrack";
  }

  // No choice recorded: tokensave awareness exists to serve a code graph, so a
  // project without one gets "off" rather than an integration with nothing to
  // read. A recorded "0" is a choice and keeps "on".
  if (get(env, "RULE_MCP_NO_TOKENSAVE") === undefined) {
    return hasTokensave(projectDir ?? process.cwd()) ? "on" : "off";
  }

  return "on";
}

/**
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} env
 * @returns {string}
 */
function readMinimalTools(env) {
  return get(env, "RULE_MCP_MINIMAL_TOOLS") === "1" ? "on" : "off";
}

/** @type {Record<string, (env: NodeJS.ProcessEnv|Record<string, string|undefined>, options?: { projectDir?: string }) => string>} */
export const READERS = {
  adr: readAdr,
  telemetry: readTelemetry,
  update: readUpdate,
  tokensave: readTokensave,
  "minimal-tools": readMinimalTools,
};

/**
 * Current level for one feature.
 *
 * @param {string} id
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} [env]
 * @param {{ projectDir?: string }} [options] - project a per-project default reads
 * @returns {string}
 */
export function readLevel(id, env = process.env, options = {}) {
  const reader = READERS[id];

  if (!reader) {
    throw new Error(`Unknown feature: ${id}`);
  }

  const level = reader(env, options);

  return levelsFor(id).includes(level) ? level : defaultLevel(id);
}

/**
 * Snapshot of every feature's level.
 *
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} [env]
 * @param {{ projectDir?: string }} [options]
 * @returns {Record<string, string>}
 */
export function readAllLevels(env = process.env, options = {}) {
  return Object.fromEntries(Object.keys(FEATURES).map((id) => [id, readLevel(id, env, options)]));
}
