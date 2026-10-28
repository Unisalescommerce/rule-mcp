/**
 * @module core/adr-policy/rule
 *
 * Human-facing ADR policy copy for reminders, instruction blocks, and tools.
 */

import { resolveAdrPolicy, levelFor } from "./_resolve.js";

/** Static rule for surfaces that cannot resolve a project policy. */
export const ADR_RULE =
  "Write an ADR with rule_tool_process_adr when the project ADR policy allows it (default: at handoff; mid-task only under full).";

/**
 * Policy-aware ADR rule for surfaces that run inside a project.
 *
 * @param {{ default: string, categories?: Record<string, string> }} [policy]
 * @param {{ terse?: boolean }} [options]
 * @returns {string}
 */
export function adrRule(policy = resolveAdrPolicy(), { terse = false } = {}) {
  const level = levelFor(policy);

  if (terse) {
    if (level === "full") {
      return "rule_tool_process_adr when structural (policy: full)";
    }

    if (level === "on-demand") {
      return "rule_tool_process_adr only on demand (policy: on-demand)";
    }

    return "rule_tool_process_adr at handoff (policy: handoff)";
  }

  if (level === "full") {
    return "A structural change earns an ADR: generate it with rule_tool_process_adr when the decision is taken (policy: full).";
  }

  if (level === "on-demand") {
    return "A structural change earns an ADR only when asked: call rule_tool_process_adr on demand (policy: on-demand).";
  }

  return "A structural change earns an ADR at handoff: call rule_tool_process_adr with moment handoff (policy: handoff). Mid-task writes need policy full or a category override.";
}
