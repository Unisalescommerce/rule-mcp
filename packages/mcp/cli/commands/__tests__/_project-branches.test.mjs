/**
 * Project commands on a root nobody recorded, and the defaults with no history.
 *
 * The home is fixed for the whole file: these commands are async, and `withHome`
 * restores the variable as soon as its callback returns.
 */
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-project-home-"));

process.env.RULE_MCP_HOME = home;
process.env.HOME = home;
process.env.USERPROFILE = home;

const { recordProject } = await import("../../install/_projects.js");
const { projectDefaults, projectRemove } = await import("../_project.js");

test.after(() => rmSync(home, { recursive: true, force: true }));

test("a remove on a root that nobody recorded is refused", async () => {
  await assert.rejects(projectRemove({ path: join(tmpdir(), "rule-mcp-not-recorded") }), /Not a recorded project/u);
});

test("the defaults are the agents asked for, then the last project, then every host", () => {
  assert.ok(projectDefaults().agents.length > 1, "no history gives every project host");
  assert.deepEqual(projectDefaults({ agents: ["claude"] }).agents, ["claude"]);

  recordProject({ root: join(home, "last"), agents: ["cursor"], projectConfig: "local" });

  assert.deepEqual(projectDefaults().agents, ["cursor"]);
});

test("a remove with a dry run plans the record it found", async () => {
  const root = join(home, "planned");

  recordProject({ root, agents: [], projectConfig: "shared" });

  await assert.doesNotReject(projectRemove({ path: root, dryRun: true }));
});
