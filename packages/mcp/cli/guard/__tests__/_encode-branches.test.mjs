/** The Codex hook answer for each decision shape. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { encodeHookAnswer } from "../_encode.js";

const codex = { hook_event_name: "PreToolUse", turn_id: "t", model: "gpt" };
const asCodex = (answer) => {
  const previous = process.env.RULE_MCP_HOOK_HOST;

  process.env.RULE_MCP_HOOK_HOST = "codex";

  try {
    return encodeHookAnswer(answer, codex);
  } finally {
    if (previous === undefined) {
      delete process.env.RULE_MCP_HOOK_HOST;
    } else {
      process.env.RULE_MCP_HOOK_HOST = previous;
    }
  }
};

test("an allow with only the decision is a silent object", () => {
  assert.deepEqual(asCodex({ hookSpecificOutput: { permissionDecision: "allow" } }), {});
});

test("an allow that carries other fields keeps them", () => {
  const answer = asCodex({ hookSpecificOutput: { permissionDecision: "allow", additionalContext: "x" } });

  assert.equal(answer.hookSpecificOutput.additionalContext, "x");
  assert.equal(answer.hookSpecificOutput.permissionDecision, undefined);
});

test("an ask with no reason gets one", () => {
  const answer = asCodex({ hookSpecificOutput: { permissionDecision: "ask" } });

  assert.ok(answer.reason.length > 0);
});
