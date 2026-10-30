/**
@module test/agents/commands/export-keep

Step 4: /rule-keep and /rule-export are defined and point at the keep/export bodies.
*/

import { strict as assert } from "node:assert";
import test from "node:test";

const { commandDefinition } = await import("../_definitions.js");
const { listPrompts } = await import("@src/prompts/index.js");

test("rule-keep and rule-export prompts are registered", () => {
  const names = listPrompts().map((prompt) => prompt.name);

  assert.ok(names.includes("rule-keep"), "rule-keep prompt exists");
  assert.ok(names.includes("rule-export"), "rule-export prompt exists");
});

test("rule-keep command body drives rule_tool_keep", () => {
  const command = commandDefinition("rule-keep");

  assert.match(command.body, /rule_tool_keep/);
  assert.match(command.body, /fingerprint/);
  assert.match(command.body, /Do not short-circuit hooks/i);
});

test("rule-export command body covers distill and interview without default delete", () => {
  const command = commandDefinition("rule-export");

  assert.match(command.body, /exportDistill|distill/i);
  assert.match(command.body, /interview|dubious/i);
  assert.match(command.body, /cleanup/i);
});
