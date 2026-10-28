import { reductionSignal } from "./_reduction-signal.js";
import { ADR_RULE } from "../../core/adr-policy/index.js";

/** Prompt words that mark a structural change worth an ADR. */
const STRUCTURAL_KEYWORDS = ["migration", "schema", "data model", "table", "column", "database", "architecture", "architectural"];

/** A structural change in the prompt points at the ADR policy rule. */
export function docsFollowup(promptLower) {
  if (reductionSignal(promptLower)) {
    return null;
  }

  const signal = STRUCTURAL_KEYWORDS.find((keyword) => promptLower.includes(keyword));

  if (!signal) {
    return null;
  }

  return {
    tool: "rule_tool_process_adr",
    signal,
    why: ADR_RULE,
  };
}
