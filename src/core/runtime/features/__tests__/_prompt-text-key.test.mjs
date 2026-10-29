/**
@module test/runtime/prompt-text-key

`RULE_MCP_NO_PROMPTS` means two different things today: it hides the MCP prompts
from a client's slash menu, and the telemetry reader treats it as "record the
prompt length only". One key, two meanings, and an install that sets it to hide
duplicate slash commands silently stops recording prompt text.

The suppression stays on that key, because every install already writes it there.
The telemetry level moves to `RULE_MCP_NO_PROMPT_TEXT`, and the old key keeps
working as a legacy alias so a config written by an earlier version still means
what it meant.
*/

import test from "node:test";
import assert from "node:assert/strict";

import { readLevel } from "../_readers.js";
import { envPatchFor } from "../_catalog.data.js";

test("the anonymous level writes its own key", () => {
  const env = envPatchFor("telemetry", "anonymous");

  assert.equal(env.RULE_MCP_NO_PROMPT_TEXT, "1", "the switch is about prompt text, not about the prompt list");
  assert.equal(env.RULE_MCP_NO_PROMPTS, null, "and it clears the key that hides slash commands, never sets it");
});

test("full clears both the new key and the old one", () => {
  const env = envPatchFor("telemetry", "full");

  assert.equal(env.RULE_MCP_NO_PROMPT_TEXT, null);
  assert.equal(env.RULE_MCP_NO_PROMPTS, null, "a config from an earlier version is cleared with it");
});

test("the old key still reads as anonymous", () => {
  assert.equal(readLevel("telemetry", { RULE_MCP_NO_PROMPTS: "1" }), "anonymous", "a legacy config keeps its meaning");
  assert.equal(readLevel("telemetry", { RULE_MCP_NO_PROMPT_TEXT: "1" }), "anonymous");
  assert.equal(readLevel("telemetry", {}), "full");
});
