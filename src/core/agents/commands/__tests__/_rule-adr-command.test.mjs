/**
@module test/agents/commands/rule-adr

Step 5 (EX-05): /rule-adr returns because it binds ADR write + decision-cache keep.
*/

import { strict as assert } from "node:assert";
import test from "node:test";

const { commandDefinition } = await import("../_definitions.js");
const { listPrompts } = await import("@src/prompts/index.js");

test("rule-adr prompt is registered", () => {
  const names = listPrompts().map((prompt) => prompt.name);

  assert.ok(names.includes("rule-adr"), "rule-adr must exist as a product prompt");
});

test("rule-adr body drives process_adr then keep", () => {
  const command = commandDefinition("rule-adr");

  assert.match(command.body, /rule_tool_process_adr/);
  assert.match(command.body, /rule_tool_keep|rule-keep/);
  assert.match(command.description, /decision-cache|keep/i);
});
