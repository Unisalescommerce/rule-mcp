import assert from "node:assert/strict";
import { test } from "node:test";

import { opencodePlugin, piExtension } from "../_hook-writers.js";

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
