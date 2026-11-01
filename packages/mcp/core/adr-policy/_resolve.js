/**
 * @module core/adr-policy/resolve
 *
 * Resolve the ADR write policy from the first source that parses. Sources are
 * never merged: a project file, the env var, saved env.json, or the default.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, parse as parsePath } from "node:path";

import {
  CATEGORIES,
  DEFAULT_LEVEL,
  LEVEL_ALIASES,
  LEVELS,
  POLICY_ENV,
  POLICY_FILE,
} from "./_words.data.js";

/**
 * Normalize a level token (aliases + case) or return null when unknown.
 *
 * @param {unknown} value
 * @returns {"full"|"handoff"|"on-demand"|null}
 */
export function normalizeLevel(value) {
  if (typeof value !== "string") {
    return null;
  }

  const key = value.trim().toLowerCase();
  const mapped = LEVEL_ALIASES[key] ?? key;

  return LEVELS.includes(mapped) ? mapped : null;
}

/**
 * Parse a policy document (plain level string or `{ default, categories }`).
 *
 * @param {unknown} raw
 * @returns {{ default: string, categories: Record<string, string> }|null}
 */
export function parsePolicyDocument(raw) {
  if (typeof raw === "string") {
    const trimmed = raw.trim();

    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith("{")) {
      try {
        return parsePolicyDocument(JSON.parse(trimmed));
      } catch {
        return null;
      }
    }

    const level = normalizeLevel(trimmed);

    return level ? { default: level, categories: {} } : null;
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const level = normalizeLevel(raw.default ?? raw.level);
  const categories = {};

  if (raw.categories && typeof raw.categories === "object") {
    for (const name of CATEGORIES) {
      const override = normalizeLevel(raw.categories[name]);

      if (override) {
        categories[name] = override;
      }
    }
  }

  if (!level && Object.keys(categories).length === 0) {
    return null;
  }

  return { default: level ?? DEFAULT_LEVEL, categories };
}

/**
 * Walk from `start` up to the filesystem root looking for `.context/adr.json`.
 *
 * @param {string} start
 * @returns {string|null}
 */
function findPolicyFile(start) {
  let dir = start;

  for (;;) {
    const candidate = join(dir, POLICY_FILE);

    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(dir);

    if (parent === dir || parsePath(dir).root === dir) {
      return null;
    }

    dir = parent;
  }
}

/**
 * Read and parse a policy file, or null when missing/invalid.
 *
 * @param {string} path
 * @returns {{ default: string, categories: Record<string, string> }|null}
 */
function readPolicyFile(path) {
  try {
    return parsePolicyDocument(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return null;
  }
}

/**
 * Resolve the effective ADR policy.
 *
 * @param {{
 *   projectDir?: string,
 *   env?: NodeJS.ProcessEnv,
 *   homeDir?: string,
 * }} [options]
 * @returns {{
 *   default: "full"|"handoff"|"on-demand",
 *   categories: Record<string, string>,
 *   source: string,
 * }}
 */
export function resolveAdrPolicy({
  projectDir = ".",
  env = process.env,
  homeDir = process.env.RULE_MCP_HOME || join(homedir(), ".rule-mcp"),
} = {}) {
  const filePath = findPolicyFile(projectDir);

  if (filePath) {
    const parsed = readPolicyFile(filePath);

    if (parsed) {
      return { ...parsed, source: POLICY_FILE };
    }
  }

  if (typeof env[POLICY_ENV] === "string" && env[POLICY_ENV].trim()) {
    const parsed = parsePolicyDocument(env[POLICY_ENV]);

    if (parsed) {
      return { ...parsed, source: "env" };
    }
  }

  try {
    const saved = JSON.parse(readFileSync(join(homeDir, "config", "env.json"), "utf8"));
    const parsed = parsePolicyDocument(saved?.[POLICY_ENV]);

    if (parsed) {
      return { ...parsed, source: "env.json" };
    }
  } catch {
    /* absent or unreadable */
  }

  return { default: DEFAULT_LEVEL, categories: {}, source: "default" };
}

/**
 * Level that applies for one category (or the default).
 *
 * @param {{ default: string, categories?: Record<string, string> }} policy
 * @param {string} [category]
 * @returns {string}
 */
export function levelFor(policy, category) {
  if (category && policy.categories?.[category]) {
    return policy.categories[category];
  }

  return policy.default;
}

/**
 * Whether an ADR write is allowed at this moment for this category.
 *
 * - `full`: always
 * - `handoff`: only when `moment` is `handoff`
 * - `on-demand`: only an explicit `rule_tool_process_adr` call (`explicit: true`);
 *   auto-log and mid-task surfaces stay silent
 *
 * @param {{ default: string, categories?: Record<string, string> }} policy
 * @param {{ category?: string, moment?: "task"|"handoff", explicit?: boolean }} [options]
 * @returns {boolean}
 */
export function allowsAdrWrite(policy, { category, moment = "task", explicit = false } = {}) {
  const level = levelFor(policy, category);

  if (level === "full") {
    return true;
  }

  if (level === "handoff") {
    return moment === "handoff";
  }

  return explicit === true;
}

/** Fingerprint for cache keys: source-independent effective policy. */
export function policyFingerprint(policy = resolveAdrPolicy()) {
  const categories = Object.keys(policy.categories ?? {})
    .sort()
    .map((name) => `${name}:${policy.categories[name]}`)
    .join(",");

  return `${policy.default}|${categories}`;
}
