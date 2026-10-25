/** Branch coverage for the optional-step catalog rows. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { extraItems } from "../_step-extras.js";

test("empty agents and rule files name the empty case", () => {
  const items = extraItems({ mode: "stdio" });
  const rules = items.find((item) => item.id === "rules");
  const hooks = items.find((item) => item.id === "hooks");
  const service = items.find((item) => item.id === "service");

  assert.match(rules.detail.join("\n"), /no agent selected/u);
  assert.match(rules.detail.join("\n"), /No instruction file/u);
  assert.equal(hooks.disabled, true);
  assert.equal(service.disabled, true);
});

test("daemon mode with Claude unlocks the service and hooks rows", () => {
  const items = extraItems({
    mode: "daemon",
    agents: ["claude"],
    ruleFiles: ["~/.claude/CLAUDE.md"],
  });
  const hooks = items.find((item) => item.id === "hooks");
  const service = items.find((item) => item.id === "service");
  const rules = items.find((item) => item.id === "rules");

  assert.equal(hooks.disabled, false);
  assert.equal(service.disabled, false);
  assert.match(service.detail.join("\n"), /LaunchAgent/u);
  assert.match(rules.detail.join("\n"), /CLAUDE\.md/u);
});

test("a Cursor or Codex selection unlocks the hooks row too", () => {
  const hooks = extraItems({ mode: "stdio", agents: ["cursor", "codex"] }).find((item) => item.id === "hooks");

  assert.equal(hooks.disabled, false);
  assert.match(hooks.detail.join("\n"), /cursor, codex/u);
});

test("an agent whose plugin has no installer target leaves the row disabled", () => {
  const hooks = extraItems({ mode: "stdio", agents: ["copilot", "kilo", "cline"] }).find((item) => item.id === "hooks");

  assert.equal(hooks.disabled, true);
});
