/**
 * @module cli/guard/_verdict
 *
 * The answers a guard can give, and the coercion that keeps the file guard out
 * of the permission system (ADR 121).
 */

/**
 * Silent pass-through: empty JSON, no permissionDecision.
 *
 * Codex PreToolUse rejects bare `permissionDecision:allow` (must pair with
 * `updatedInput` or omit the field). Claude and Cursor treat `{}` as continue.
 */
export const SILENT = {};

/** @deprecated use SILENT - kept as an alias so call sites stay readable */
export const ALLOW = SILENT;

/** @param {string} reason @returns {object} */
export const deny = (reason) => ({
  hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
});

/** @param {string} reason @returns {object} */
export const ask = (reason) => ({
  hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason },
});

/**
 * Report to the model without deciding anything: PostToolUse carries
 * `additionalContext`, which the host appends to the turn and nobody confirms.
 *
 * @param {string} context - what the model should know about the file it wrote
 * @returns {object} hook output
 */
export const advise = (context) => ({
  hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: context },
});

/**
 * Strip every way a hook answer can stop a tool call, so a file guard can only
 * ever report (ADR 121). An `ask` or a `deny` becomes an `allow`; the fields a
 * host reads to block the turn are dropped.
 *
 * @param {object} [answer] - what the write path produced
 * @returns {object} the same answer, unable to block
 */
export function neverBlocks(answer = {}) {
  const rest = { ...answer };

  for (const field of ["decision", "reason", "continue", "stopReason"]) {
    delete rest[field];
  }

  const specific = rest.hookSpecificOutput;

  if (!specific) {
    return rest;
  }

  // Drop the decision fields entirely. Setting permissionDecision:allow breaks
  // Codex PreToolUse; an empty/advice-only object is the universal pass-through.
  const { permissionDecision: _decision, permissionDecisionReason: _reason, ...safe } = specific;

  if (Object.keys(safe).length === 0) {
    const { hookSpecificOutput: _drop, ...without } = rest;

    return without;
  }

  return { ...rest, hookSpecificOutput: safe };
}
