/**
@module test/installers/rules-project

A project keeps the rules block it was installed with. The refresh replaces that
block and keeps the rest of the file, and it creates nothing: a project without a
block is not this step's business.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { refreshProjectRules } from "../_rules-project.js";
import { INSTRUCTION_BLOCKS, RULES_MARKER, closingMarker } from "../_instruction.data.js";

const project = mkdtempSync(join(tmpdir(), "rule-rules-project-"));
const mine = "# Project notes\n\nOur own convention lives here.\n";

const stale = `${mine}\n${RULES_MARKER}\n\n- an old rule that no longer ships\n\n${closingMarker(RULES_MARKER)}\n`;

test.beforeEach(() => {
  writeFileSync(join(project, "CLAUDE.md"), stale);
  rmSync(join(project, "AGENTS.md"), { force: true });
});

test.after(() => rmSync(project, { recursive: true, force: true }));

test("the block is replaced and the project's own text is kept", () => {
  const [result] = refreshProjectRules(project);
  const body = readFileSync(join(project, "CLAUDE.md"), "utf8");

  assert.equal(result.status, "refreshed");
  assert.ok(body.includes("Our own convention lives here."), "the file's own text survives");
  assert.equal(body.includes("an old rule that no longer ships"), false, "the stale rule is gone");
  assert.ok(body.includes(INSTRUCTION_BLOCKS[1].split("\n", 3)[2]), "and the shipped rule is there");
});

test("a file without the block is left alone, and no file is created", () => {
  const results = refreshProjectRules(project);
  const test = results.find((entry) => entry.file.endsWith("AGENTS.md"));

  assert.equal(test.status, "absent");
  assert.equal(
    results.some((entry) => entry.file.endsWith(".cursorrules")),
    true,
    "every candidate is reported",
  );
});

test("a second run says current", () => {
  refreshProjectRules(project);
  const second = refreshProjectRules(project);

  assert.equal(second[0].status, "current");
});

test("a dry run reports planned and writes nothing", () => {
  const before = readFileSync(join(project, "CLAUDE.md"), "utf8");
  const [result] = refreshProjectRules(project, { dryRun: true });

  assert.equal(result.status, "planned");
  assert.equal(readFileSync(join(project, "CLAUDE.md"), "utf8"), before);
});
