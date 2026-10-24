import assert from "node:assert/strict";
import { test } from "node:test";

import { hookSupport } from "../_hook-hosts.js";

test("the three documented hosts expose their events", () => {
  for (const agent of ["claude", "cursor", "gemini"]) {
    const support = hookSupport(agent);
    assert.equal(support.supported, true, agent);
    assert.ok(support.events.length > 0, agent);
  }
});

test("codex, copilot and an unknown host stay disabled with a reason", () => {
  for (const agent of ["codex", "copilot", "nope"]) {
    const support = hookSupport(agent);
    assert.equal(support.supported, false, agent);
    assert.ok(support.reason.length > 0, agent);
  }
});
