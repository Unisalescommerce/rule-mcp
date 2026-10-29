/**
 * RULE_MCP_* environment configuration: where it lives on disk, the opt-out
 * defaults, and the mcpServerConfig builders that merge env + CLI args.
 * @module cli/installers/env
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { getRuntimePaths } from "../paths/index.js";

/** Legacy path from before RULE_MCP_HOME owned the switches file. */
const LEGACY_ENV_CONFIG_DIR = join(homedir(), ".config", "rule-mcp");
const LEGACY_ENV_CONFIG_FILE = join(LEGACY_ENV_CONFIG_DIR, "env.json");

/** Canonical switches dir: `~/.rule-mcp/config` (relocatable via RULE_MCP_HOME). */
export function ENV_CONFIG_DIR() {
  return getRuntimePaths().configDir;
}

/** Canonical switches file under the runtime home. */
export function ENV_CONFIG_FILE() {
  return join(ENV_CONFIG_DIR(), "env.json");
}

/**
 * The compiled code cache directory handed to every agent spawn.
 *
 * stdio starts the server as a subprocess per client, so module compilation is
 * paid per connect. A per-user directory keeps the cache out of the install
 * tree (which may be read-only, or shared between users).
 */
const COMPILE_CACHE_DIR = join(homedir(), ".cache", "rule-mcp", "compile-cache");

const DEFAULT_OPTOUT_ENV = {
  RULE_MCP_NO_AUTOUPDATE: "0",
  RULE_MCP_NO_AUTORESTART: "0",
  RULE_MCP_NO_CACHE: "0",
  RULE_MCP_NO_COMPRESSION: "0",
  RULE_MCP_NO_REMINDER: "0",
  RULE_MCP_NO_FLIGHT: "0",
  RULE_MCP_NO_PROMPTS: "1",
};

/** Env var that selects the minimal MCP tool surface (see core/skills/_minimal.js). */
export const MINIMAL_ENV_VAR = "RULE_MCP_MINIMAL_TOOLS";

/**
 * The minimal choice an environment carries, or nothing when it carries none.
 *
 * Pure so the installer can be tested without a home directory: the saved
 * file stays the job of `resolveEnvironment`, this only reads the ambient.
 *
 * @param {object} [env]
 */
export function minimalEnvFrom(env = process.env) {
  const value = env[MINIMAL_ENV_VAR];

  return value === undefined ? {} : { [MINIMAL_ENV_VAR]: value };
}

function readEnvConfig() {
  try {
    const canonical = ENV_CONFIG_FILE();
    const path = existsSync(canonical)
      ? canonical
      : existsSync(LEGACY_ENV_CONFIG_FILE)
        ? LEGACY_ENV_CONFIG_FILE
        : null;

    if (!path) {
      return {};
    }

    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

function writeEnvConfig(environment) {
  const dir = ENV_CONFIG_DIR();

  mkdirSync(dir, { recursive: true });
  writeFileSync(ENV_CONFIG_FILE(), JSON.stringify(environment, null, 2) + "\n", "utf8");
}

function resolveEnvironment(options = {}) {
  const saved = readEnvConfig();
  // Opt-out defaults are the base so they always appear in generated config;
  // saved preferences and explicit opts override them.
  // The cache directory is not an opt-out flag, so it sits beside the table
  // rather than in it: every entry there is a documented "0" the user flips.
  // An ambient minimal choice rides along between saved and explicit: the
  // running server already honors it (see core/skills/_minimal.js), so the
  // written config says what the runtime does instead of hiding it.
  return { NODE_COMPILE_CACHE: COMPILE_CACHE_DIR, ...DEFAULT_OPTOUT_ENV, ...saved, ...minimalEnvFrom(), ...options.env };
}

export {
  LEGACY_ENV_CONFIG_DIR,
  LEGACY_ENV_CONFIG_FILE,
  DEFAULT_OPTOUT_ENV,
  readEnvConfig,
  writeEnvConfig,
  resolveEnvironment,
};
