/**
 * @module core/adr-policy/words
 *
 * Vocabulary for the ADR write policy: levels, categories, aliases, and the
 * file/env names that carry it.
 */

/** Project-relative policy file, walked upward from the working directory. */
export const POLICY_FILE = ".context/adr.json";

/** Environment / env.json key for the ADR write policy. */
export const POLICY_ENV = "RULE_MCP_ADR_POLICY";

/** Levels a policy may name. */
export const LEVELS = ["full", "handoff", "on-demand"];

/** Categories that may override the default level. */
export const CATEGORIES = ["schema", "dependency", "api", "infra"];

/** Synonyms accepted in files and env values. */
export const LEVEL_ALIASES = {
  decision: "full",
  off: "on-demand",
};

/** Default when no source answers. Handoff-time writes; mid-task calls refuse. */
export const DEFAULT_LEVEL = "handoff";
