/** A tool or a call with nothing to compare has no candidates. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { buildDecisionCandidates } from "../_decision-candidates.js";

test("a tool that does not normalize has no candidates", () => {
  assert.deepEqual(buildDecisionCandidates("rule_tool_detect", {}), []);
});

test("a call with no prompt has no candidates", () => {
  assert.deepEqual(buildDecisionCandidates("rule_tool", {}), []);
});
