/**
@module test/cli/project-command

`rule-mcp project add|remove`: the membership command for project-scope
installs. A project is added from the configuration the last recorded project
used, so a second checkout is one command away, and removing one takes back
every config it wrote and forgets it from the store.

@see ADR 193 - setup --scope project records projects.json and wires install writers
*/

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "rule-project-command-"));

process.env.HOME = home;
process.env.RULE_MCP_HOME = join(home, "rh");
process.env.RULE_MCP_NO_AUTOUPDATE = "1";
process.env.RULE_MCP_NO_TELEMETRY = "1";
process.env.RULE_MCP_NO_PROMPTS = "1";

const { listProjects } = await import("../install/_projects.js");
const { projectAdd, projectRemove } = await import("../commands/_project.js");

const first = join(home, "first");
const second = join(home, "second");

mkdirSync(first, { recursive: true });
mkdirSync(second, { recursive: true });

test.after(() => rmSync(home, { recursive: true, force: true }));

test("add writes the project entry, with a portable command and no machine path", async () => {
  const result = await projectAdd({ path: first, agents: ["cursor"], dryRun: false });
  const entry = JSON.parse(readFileSync(join(first, ".cursor", "mcp.json"), "utf8")).mcpServers["rule-mcp"];

  assert.equal(result.dryRun, false);
  assert.equal(entry.command, "rule-mcp");
  assert.deepEqual(entry.args, ["serve"]);
  assert.equal(entry.env, undefined, "a shared entry carries no machine environment");
  assert.ok(
    listProjects().some((project) => project.root === first),
    "the project is recorded",
  );
});

test("a second project copies the configuration of the last one recorded", async () => {
  await projectAdd({ path: second, dryRun: false });

  assert.ok(existsSync(join(second, ".cursor", "mcp.json")), "same agent as the last recorded project");
  const recorded = listProjects().find((project) => project.root === second);

  assert.equal(recorded.projectConfig, "shared");
});

test("removing a project takes its config back and forgets it", async () => {
  const result = await projectRemove({ path: second, dryRun: false });

  assert.equal(existsSync(join(second, ".cursor", "mcp.json")), false, "the entry is gone");
  assert.equal(
    listProjects().some((project) => project.root === second),
    false,
    "the store no longer names it",
  );
  assert.ok(result.results.length > 0);
});

test("a dry run writes nothing and reports what it would do", async () => {
  const result = await projectAdd({ path: join(home, "third"), agents: ["cursor"], dryRun: true });

  assert.equal(result.dryRun, true);
  assert.equal(existsSync(join(home, "third", ".cursor", "mcp.json")), false);
  assert.equal(
    listProjects().some((project) => project.root === join(home, "third")),
    false,
  );
});

test("an agent with no project file is refused by name", async () => {
  await assert.rejects(() => projectAdd({ path: first, agents: ["cline"], dryRun: true }), /Not a project-capable agent/);
});
