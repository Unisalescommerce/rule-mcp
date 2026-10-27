/** projects.json records each project-scope install for refresh and uninstall. */
import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-projects-"));
process.env.HOME = home;
process.env.RULE_MCP_HOME = home;

const { forgetProject, listProjects, projectsPath, readProjects, recordProject } = await import("../_projects.js");

test.after(() => rmSync(home, { recursive: true, force: true }));

test("projectsPath lives under the runtime state directory", () => {
  assert.equal(projectsPath(), join(home, "state", "projects.json"));
});

test("readProjects returns an empty store when the file is absent", () => {
  assert.deepEqual(readProjects(), { version: 1, projects: {} });
});

test("recordProject writes one project keyed by absolute root", () => {
  const root = join(home, "repo-a");
  const written = { cursor: [join(root, ".cursor", "mcp.json")] };

  recordProject({
    root,
    agents: ["cursor"],
    projectConfig: "shared",
    written,
    dryRun: false,
  });

  assert.ok(existsSync(projectsPath()));
  const store = JSON.parse(readFileSync(projectsPath(), "utf8"));

  assert.equal(store.version, 1);
  assert.deepEqual(store.projects[root].agents, ["cursor"]);
  assert.equal(store.projects[root].projectConfig, "shared");
  assert.deepEqual(store.projects[root].written, written);
  assert.equal(typeof store.projects[root].installedAt, "string");
});

test("recordProject merges agents and written paths on the same root", () => {
  const root = join(home, "repo-a");

  recordProject({
    root,
    agents: ["claude"],
    projectConfig: "shared",
    written: { claude: [join(root, ".mcp.json")] },
    dryRun: false,
  });

  const entry = readProjects().projects[root];

  assert.deepEqual(entry.agents, ["claude", "cursor"]);
  assert.deepEqual(entry.written.cursor, [join(root, ".cursor", "mcp.json")]);
  assert.deepEqual(entry.written.claude, [join(root, ".mcp.json")]);
});

test("listProjects returns recorded roots sorted", () => {
  const other = join(home, "repo-b");

  recordProject({
    root: other,
    agents: ["pi"],
    projectConfig: "local",
    written: { pi: [join(other, ".mcp.json")] },
    dryRun: false,
  });

  assert.deepEqual(
    listProjects().map((entry) => entry.root),
    [join(home, "repo-a"), other].sort(),
  );
});

test("forgetProject drops one root and deletes the file when empty", () => {
  forgetProject({ root: join(home, "repo-a"), dryRun: false });
  forgetProject({ root: join(home, "repo-b"), dryRun: false });

  assert.deepEqual(readProjects(), { version: 1, projects: {} });
  assert.equal(existsSync(projectsPath()), false);
});

test("recordProject dryRun leaves the filesystem untouched", () => {
  const root = join(home, "repo-dry");

  recordProject({
    root,
    agents: ["cursor"],
    projectConfig: "shared",
    written: { cursor: [join(root, ".cursor", "mcp.json")] },
    dryRun: true,
  });

  assert.equal(existsSync(projectsPath()), false);
  assert.equal(readProjects().projects[root], undefined);
});
