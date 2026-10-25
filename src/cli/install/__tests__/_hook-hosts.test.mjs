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

  assert.equal(hookSupport("codex").mechanism, "native");
});

test("every native host names the file it writes, and the others do not", () => {
  for (const agent of ["claude", "cursor", "gemini", "codex", "kiro"]) {
    assert.ok(hookSupport(agent).file, agent);
  }

  for (const agent of ["opencode", "pi", "copilot"]) {
    assert.equal(hookSupport(agent).file, undefined, agent);
  }
});

test("copilot and an unknown host have no mechanism", () => {
  for (const agent of ["copilot", "nope"]) {
    assert.equal(hookSupport(agent).mechanism, "none", agent);
  }
});
