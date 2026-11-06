/** A call with no arguments, and a call with far too many. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { preprocessToolCall } from "../_preprocess.js";

test("a call with no arguments is an empty object", () => {
  assert.doesNotThrow(() => preprocessToolCall("rule_tool_detect"));
});

test("arguments over the byte cap are refused", () => {
  assert.throws(() => preprocessToolCall("rule_tool_detect", { text: "x".repeat(5_000_000) }), /arguments exceed/u);
});
