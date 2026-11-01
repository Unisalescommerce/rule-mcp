/** Codex PreToolUse rejects bare permissionDecision:allow and :ask. */
import assert from "node:assert/strict";
import { test } from "node:test";

const { encodeHookAnswer, isCodexHook } = await import("../_encode.js");
const { ALLOW, SILENT, ask, deny } = await import("../_verdict.js");

test("Codex is detected from turn_id or RULE_MCP_HOOK_HOST", () => {
  assert.equal(isCodexHook({ turn_id: "t1" }), true);
  assert.equal(isCodexHook({}), false);

  const previous = process.env.RULE_MCP_HOOK_HOST;

  process.env.RULE_MCP_HOOK_HOST = "codex";
  assert.equal(isCodexHook({}), true);
  process.env.RULE_MCP_HOOK_HOST = previous;
});

test("non-Codex ask keeps permissionDecision:ask", () => {
  assert.deepEqual(encodeHookAnswer(ask("confirm"), {}), ask("confirm"));
});

test("allow is already silent, and stays silent on Codex", () => {
  assert.deepEqual(ALLOW, SILENT);
  assert.deepEqual(encodeHookAnswer(ALLOW, { turn_id: "t1" }), SILENT);
  assert.equal(encodeHookAnswer(ALLOW, { turn_id: "t1" }).hookSpecificOutput?.permissionDecision, undefined);
});

test("Codex ask becomes decision:block with the reason", () => {
  assert.deepEqual(encodeHookAnswer(ask("confirm this"), { turn_id: "t1" }), {
    decision: "block",
    reason: "confirm this",
  });
});

test("Codex deny keeps permissionDecision:deny with a reason", () => {
  assert.deepEqual(encodeHookAnswer(deny("nope"), { turn_id: "t1" }), deny("nope"));
});
