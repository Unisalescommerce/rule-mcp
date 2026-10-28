/**
 * @module core/runtime/features/catalog
 *
 * User-facing feature switches. Each feature lists levels with the default
 * first; each level is the env keys it writes (`null` removes the key).
 */

/** @typedef {Record<string, string|null>} EnvPatch */

/**
 * Feature id -> ordered levels -> env patch.
 *
 * Order of `Object.keys(levels)` is the default-first level list.
 *
 * @type {Record<string, { label: string, levels: Record<string, EnvPatch>, aliases?: Record<string, string> }>}
 */
export const FEATURES = {
  adr: {
    label: "ADR tools and numbering",
    levels: {
      on: { RULE_MCP_NO_ADR: null },
      off: { RULE_MCP_NO_ADR: "1" },
    },
  },
  telemetry: {
    label: "Local telemetry",
    levels: {
      full: {
        RULE_MCP_NO_TELEMETRY: null,
        RULE_MCP_NO_PROMPTS: null,
        RULE_MCP_TELEMETRY_ANONYMOUS: null,
      },
      anonymous: {
        RULE_MCP_NO_TELEMETRY: null,
        RULE_MCP_NO_PROMPTS: "1",
        RULE_MCP_TELEMETRY_ANONYMOUS: "1",
      },
      off: {
        RULE_MCP_NO_TELEMETRY: "1",
        RULE_MCP_NO_PROMPTS: null,
        RULE_MCP_TELEMETRY_ANONYMOUS: null,
      },
    },
  },
  update: {
    label: "Self-update checks",
    levels: {
      auto: { RULE_MCP_NO_AUTOUPDATE: null, RULE_MCP_AUTO_UPDATE: "merge" },
      notify: { RULE_MCP_NO_AUTOUPDATE: null, RULE_MCP_AUTO_UPDATE: null },
      off: { RULE_MCP_NO_AUTOUPDATE: "1", RULE_MCP_AUTO_UPDATE: null },
    },
  },
  tokensave: {
    label: "Tokensave awareness",
    levels: {
      on: { RULE_MCP_NO_TOKENSAVE: null, RULE_MCP_TOKENSAVE_AUTOTRACK: null },
      autotrack: { RULE_MCP_NO_TOKENSAVE: null, RULE_MCP_TOKENSAVE_AUTOTRACK: "1" },
      off: { RULE_MCP_NO_TOKENSAVE: "1", RULE_MCP_TOKENSAVE_AUTOTRACK: null },
    },
    // The level reads as what it does when spoken: on, plus autotrack. The
    // catalog keeps one canonical spelling so `levelsFor` lists a level once and
    // the env patch stays single-sourced; the other name is only an input.
    aliases: { "on+autotrack": "autotrack" },
  },
  "minimal-tools": {
    label: "Minimal MCP tool surface",
    levels: {
      off: { RULE_MCP_MINIMAL_TOOLS: null },
      on: { RULE_MCP_MINIMAL_TOOLS: "1" },
    },
  },
};

/** Stable feature ids in catalog order. */
export function featureIds() {
  return Object.keys(FEATURES);
}

/**
 * Levels for one feature, default first.
 *
 * @param {string} id
 * @returns {string[]}
 */
export function levelsFor(id) {
  const feature = FEATURES[id];

  if (!feature) {
    throw new Error(`Unknown feature: ${id}`);
  }

  return Object.keys(feature.levels);
}

/**
 * The level a user meant, whatever name they typed.
 *
 * @param {string} id
 * @param {string} level
 * @returns {string}
 */
export function canonicalLevel(id, level) {
  const feature = FEATURES[id];

  if (!feature) {
    throw new Error(`Unknown feature: ${id}`);
  }

  return feature.aliases?.[level] ?? level;
}

/**
 * Env keys one level writes (`null` means remove).
 *
 * @param {string} id
 * @param {string} level
 * @returns {EnvPatch}
 */
export function envPatchFor(id, level) {
  const feature = FEATURES[id];

  if (!feature) {
    throw new Error(`Unknown feature: ${id}`);
  }

  const patch = feature.levels[canonicalLevel(id, level)];

  if (!patch) {
    throw new Error(`Unknown level "${level}" for feature ${id}`);
  }

  return { ...patch };
}

/** Default level for a feature (first in the list). */
export function defaultLevel(id) {
  return levelsFor(id)[0];
}
