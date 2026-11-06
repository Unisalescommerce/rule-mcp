/** The update mode: notify unless the environment asks for an upgrade. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { buildBanner } from "../_banner.js";
import { updateMode } from "../_config.js";

/** Run `fn` with RULE_MCP_AUTO_UPDATE set to `value`, or unset for undefined. */
function withMode(value, fn) {
  const previous = process.env.RULE_MCP_AUTO_UPDATE;

  if (value === undefined) {
    delete process.env.RULE_MCP_AUTO_UPDATE;
  } else {
    process.env.RULE_MCP_AUTO_UPDATE = value;
  }

  try {
    fn();
  } finally {
    if (previous === undefined) {
      delete process.env.RULE_MCP_AUTO_UPDATE;
    } else {
      process.env.RULE_MCP_AUTO_UPDATE = previous;
    }
  }
}

test("an unset variable means the update is announced, not applied", () => {
  withMode(undefined, () => assert.equal(updateMode(), "notify"));
});

test("an empty variable means notify too", () => {
  withMode("", () => assert.equal(updateMode(), "notify"));
});

test("only the word upgrade applies an update", () => {
  withMode("upgrade", () => assert.equal(updateMode(), "upgrade"));
});

test("notify stays notify, and an unknown value does not become an upgrade", () => {
  withMode("notify", () => assert.equal(updateMode(), "notify"));
  withMode("merge", () => assert.equal(updateMode(), "notify"));
});

test("the banner names the command to run and the opt-in", () => {
  const banner = buildBanner({ available: true, to: "1.2.0", release: "v1.2.0" });

  assert.match(banner, /\/rule-update/u);
  assert.match(banner, /rule-mcp update/u);
  assert.match(banner, /RULE_MCP_AUTO_UPDATE=upgrade/u);
  assert.doesNotMatch(banner, /applies itself/u);
});

test("an explicit call is the request to apply, whatever the ambient default is", async () => {
  const { explicitMode } = await import("../_explicit.js");

  withMode(undefined, () => assert.equal(explicitMode(), "upgrade"));
  withMode("notify", () => assert.equal(explicitMode(), "upgrade"));
});
