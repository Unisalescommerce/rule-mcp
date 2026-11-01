/**
@module test/cli/update-reapply

An update moves the code under every recorded install, so the installs have to
follow: the commands, skills and env a host carries are written from this tree.
The reapply reads the manifest and `projects.json`, so an empty machine is the
case that must stay silent and cheap.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "rule-update-reapply-"));

process.env.HOME = home;
process.env.RULE_MCP_HOME = join(home, "rh");
process.env.RULE_MCP_NO_AUTOUPDATE = "1";
process.env.RULE_MCP_NO_TELEMETRY = "1";
process.env.RULE_MCP_NO_PROMPTS = "1";

const { reapplyRememberedInstalls } = await import("../commands/_health.js");

test.after(() => rmSync(home, { recursive: true, force: true }));

test("a machine with nothing recorded re-applies nothing", async () => {
  const result = await reapplyRememberedInstalls();

  assert.deepEqual(result, { global: 0, projects: 0 }, "no manifest and no projects means no work");
});
