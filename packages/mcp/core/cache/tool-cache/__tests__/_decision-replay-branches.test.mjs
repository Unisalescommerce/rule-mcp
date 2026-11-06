/** A replay happens only when it is on, for a cacheable tool, with a decision. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { cacheLookupDecision } from "../_decision-replay.js";

/** Run with the replay flag on, and put the old value back. */
async function withReplay(fn) {
  const previous = process.env.RULE_MCP_DECISION_CACHE_REPLAY;

  process.env.RULE_MCP_DECISION_CACHE_REPLAY = "1";

  try {
    return await fn();
  } finally {
    if (previous === undefined) {
      delete process.env.RULE_MCP_DECISION_CACHE_REPLAY;
    } else {
      process.env.RULE_MCP_DECISION_CACHE_REPLAY = previous;
    }
  }
}

test("with the flag off nothing is looked up", async () => {
  assert.equal(await cacheLookupDecision("rule_tool", { prompt: "x" }), undefined);
});

test("a tool outside the cache is never replayed", async () => {
  assert.equal(await withReplay(() => cacheLookupDecision("rule_tool_apply", {})), undefined);
});

test("with no decision model there is nothing to replay", async () => {
  assert.equal(await withReplay(() => cacheLookupDecision("rule_tool", { prompt: "x" })), undefined);
});
