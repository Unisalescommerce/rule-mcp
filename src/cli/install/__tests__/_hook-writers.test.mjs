import assert from "node:assert/strict";
import { test } from "node:test";

import { codexHooks, geminiHooks, opencodePlugin, piExtension } from "../_hook-writers.js";

test("the OpenCode plugin uses the documented tool events", () => {
  const source = opencodePlugin("/bin/rule-mcp");
  assert.match(source, /tool\.execute\.before/);
  assert.match(source, /tool\.execute\.after/);
});

test("the Pi extension uses tool_call and tool_result", () => {
  const source = piExtension("/bin/rule-mcp");
  assert.match(source, /pi\.on\("tool_call"/);
  assert.match(source, /pi\.on\("tool_result"/);
});

test("the Gemini payload uses BeforeTool and AfterTool with a command hook", () => {
  const hooks = geminiHooks("/bin/rule-mcp");

  assert.equal(hooks.BeforeTool[0].hooks[0].type, "command");
  assert.equal(hooks.AfterTool[0].hooks[0].command, "/bin/rule-mcp");
});

test("the Codex payload uses PreToolUse and PostToolUse matcher groups", () => {
  const hooks = codexHooks("/bin/rule-mcp");

  assert.equal(hooks.PreToolUse[0].hooks[0].type, "command");
  assert.equal(hooks.PostToolUse[0].matcher, "Bash|apply_patch|Edit|Write");
});
