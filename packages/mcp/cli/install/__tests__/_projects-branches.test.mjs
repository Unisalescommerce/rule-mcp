/** The project record refuses a call with no root, and survives a bad file. */
import { strict as assert } from "node:assert";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import test from "node:test";

import { withHome } from "rule-mcp-shared";

import { forgetProject, listProjects, projectsPath, recordProject } from "../_projects.js";

test("a call with no root is refused both ways", () => {
  assert.throws(() => recordProject({}), /requires a project root/u);
  assert.throws(() => forgetProject(), /requires a project root/u);
});

test("a file with no project map reads as no projects", () => {
  withHome(() => {
    mkdirSync(dirname(projectsPath()), { recursive: true });
    writeFileSync(projectsPath(), '{"projects":"nope"}');

    assert.equal(Object.keys(listProjects()).length, 0);
  });
});

test("a second record keeps the kind and the agents of the first", () => {
  withHome(() => {
    recordProject({ root: "/tmp/p", agents: ["claude"], projectConfig: "local" });
    recordProject({ root: "/tmp/p", agents: ["cursor"], projectConfig: undefined });

    const [entry] = Object.values(listProjects());

    assert.deepEqual(entry.agents.sort(), ["claude", "cursor"]);
  });
});
