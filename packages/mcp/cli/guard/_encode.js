/** @module cli/guard/encode - host-shaped PreToolUse answers */

/**
 * Whether this hook payload (or env) is Codex CLI.
 *
 * Codex rejects bare `permissionDecision:allow` and `:ask` on PreToolUse
 * (openai/codex output_parser). A silent `{}` is the pass-through; ask must
 * become `decision:block` with a reason.
 *
 * @param {object} [payload]
 * @returns {boolean}
 */
export function isCodexHook(payload = {}) {
  if (process.env.RULE_MCP_HOOK_HOST === "codex") {
    return true;
  }

  return Boolean(payload?.turn_id);
}

/**
 * Shape a guard answer for the host that invoked the hook.
 *
 * Non-Codex hosts keep the Claude-compatible `permissionDecision` vocabulary.
 * Codex gets a silent object for allow, and `decision:block` for ask.
 *
 * @param {object} answer
 * @param {object} [payload]
 * @returns {object}
 */
export function encodeHookAnswer(answer = {}, payload = {}) {
  if (!isCodexHook(payload)) {
    return answer;
  }

  const decision = answer?.hookSpecificOutput?.permissionDecision;

  if (!decision || decision === "allow") {
    const specific = answer.hookSpecificOutput;

    if (!specific) {
      return {};
    }

    const { permissionDecision: _d, permissionDecisionReason: _r, ...rest } = specific;

    return Object.keys(rest).length > 0 ? { ...answer, hookSpecificOutput: rest } : {};
  }

  if (decision === "ask") {
    const reason = String(answer.hookSpecificOutput?.permissionDecisionReason ?? "").trim() || "rule-mcp asks for confirmation";

    return { decision: "block", reason };
  }

  return answer;
}
