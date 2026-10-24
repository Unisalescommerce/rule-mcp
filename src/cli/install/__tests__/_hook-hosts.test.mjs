import assert from "node:assert/strict";
import { test } from "node:test";

import { hookSupport } from "../_hook-hosts.js";

test("each documented host names its mechanism and events", () => {
  for (const [agent, mechanism] of [
    ["claude", "native"],
    ["cursor", "native"],
    ["gemini", "native"],
    ["opencode", "plugin"],
    ["pi", "extension"],
  ]) {
    const support = hookSupport(agent);
    assert.equal(support.mechanism, mechanism, agent);
    assert.ok(support.events.length > 0, agent);
  }
});

test("codex, copilot and an unknown host have no mechanism", () => {
  for (const agent of ["codex", "copilot", "nope"]) {
    assert.equal(hookSupport(agent).mechanism, "none", agent);
  }
});
