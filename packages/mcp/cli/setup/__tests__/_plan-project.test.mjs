/** Project-scope install plan writes into projects and records projects.json. */
import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-plan-project-"));
const project = join(home, "app");

process.env.HOME = home;
process.env.RULE_MCP_HOME = home;
mkdirSync(project, { recursive: true });

test.after(() => rmSync(home, { recursive: true, force: true }));

const { buildProjectInstallPlan, buildProjectRefreshPlan, buildProjectUninstallPlan } = await import("../_plan-project.js");
const { listProjects, readProjects } = await import("../../install/_projects.js");
const { readManifest } = await import("../../install/_manifest.js");

async function runPlan(plan) {
  for (const task of plan) {
    await task.run({ dryRun: false });
  }
}

test("project install plan writes MCP configs and records projects.json", async () => {
  const plan = buildProjectInstallPlan({
    agents: ["cursor"],
    projects: [project],
    projectConfig: "shared",
  });

  assert.ok(plan.some((task) => task.id === "runtime-home"));
  assert.ok(plan.some((task) => task.id.startsWith("project:")));
  assert.ok(
    plan.every((task) => !(task.id === "shim")),
    "project scope skips the global shim",
  );
  assert.ok(
    plan.every((task) => !(task.id === "skills")),
    "project scope skips skills",
  );

  await runPlan(plan);

  const mcp = join(project, ".cursor", "mcp.json");

  assert.ok(existsSync(mcp));
  assert.equal(JSON.parse(readFileSync(mcp, "utf8")).mcpServers["rule-mcp"].command, "rule-mcp");

  const recorded = listProjects();

  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].root, project);
  assert.deepEqual(recorded[0].agents, ["cursor"]);
  assert.deepEqual(recorded[0].written.cursor, [mcp]);
  assert.deepEqual(readManifest().hosts.cursor.written, [mcp]);
});

test("refresh plan rewrites recorded project configs", async () => {
  const mcp = join(project, ".cursor", "mcp.json");

  writeFileSync(mcp, `${JSON.stringify({ mcpServers: { other: { command: "x" } } }, null, 2)}\n`);

  await runPlan(buildProjectRefreshPlan());

  const json = JSON.parse(readFileSync(mcp, "utf8"));

  assert.equal(json.mcpServers["rule-mcp"].command, "rule-mcp");
  assert.equal(json.mcpServers.other.command, "x", "refresh upserts without wiping siblings");
});

test("uninstall plan removes project entries and forgets the store", async () => {
  await runPlan(buildProjectUninstallPlan());

  const leftover = JSON.parse(readFileSync(join(project, ".cursor", "mcp.json"), "utf8"));

  assert.equal(leftover.mcpServers?.["rule-mcp"], undefined);
  assert.deepEqual(readProjects(), { version: 1, projects: {} });
});

test("project install refuses an empty project list", () => {
  assert.throws(() => buildProjectInstallPlan({ agents: ["cursor"], projects: [], projectConfig: "shared" }), /--project/);
});
