/**
 * @module core/runtime/features/adr-gate
 *
 * When the `adr` feature is off (`RULE_MCP_NO_ADR=1`), ADR tools, prompts and
 * numbering hooks stay out of the surface.
 */

/** MCP tools removed when the ADR feature is off. */
export const ADR_FEATURE_TOOLS = new Set(["rule_tool_process_adr", "rule_tool_handoff", "rule_tool_handon"]);

/** Slash / MCP prompts removed when the ADR feature is off. */
export const ADR_FEATURE_PROMPTS = new Set(["rule-handoff", "rule-handon"]);

/**
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} [env]
 * @returns {boolean}
 */
export function isAdrFeatureOff(env = process.env) {
  return env.RULE_MCP_NO_ADR === "1";
}
