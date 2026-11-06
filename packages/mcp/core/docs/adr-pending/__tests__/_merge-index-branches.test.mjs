/** The merge driver regenerates each index, on any path separator, and only those. */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { mergeGeneratedIndex } from "../_merge-index.js";

/** A project with both families and a file for the merge to write. */
function project(t) {
  const projectDir = mkdtempSync(join(tmpdir(), "rule-mcp-merge-index-"));

  mkdirSync(join(projectDir, "docs", "adr"), { recursive: true });
  mkdirSync(join(projectDir, "docs", "handoff"), { recursive: true });
  t.after(() => rmSync(projectDir, { recursive: true, force: true }));

  return { projectDir, ours: join(projectDir, "ours.md") };
}

test("the ADR index is regenerated, on a nested path too", (t) => {
  const { projectDir, ours } = project(t);

  assert.deepEqual(mergeGeneratedIndex(null, ours, null, "docs/adr/ADR.md", { projectDir }), { regenerated: true, kind: "adr" });
  assert.deepEqual(mergeGeneratedIndex(null, ours, null, "sub/docs/adr/ADR.md", { projectDir }), { regenerated: true, kind: "adr" });
  assert.ok(readFileSync(ours, "utf8").length > 0);
});

test("the handoff index is regenerated, with Windows separators too", (t) => {
  const { projectDir, ours } = project(t);

  assert.equal(mergeGeneratedIndex(null, ours, null, String.raw`docs\handoff\HANDOFF.md`, { projectDir }).kind, "handoff");
  assert.equal(mergeGeneratedIndex(null, ours, null, "docs/handoff/HANDOFF.md", { projectDir }).kind, "handoff");
});

test("any other file is left to git", (t) => {
  const { projectDir, ours } = project(t);

  writeFileSync(ours, "mine");

  assert.deepEqual(mergeGeneratedIndex(null, ours, null, "README.md", { projectDir }), { regenerated: false, kind: null });
  assert.equal(readFileSync(ours, "utf8"), "mine");
});
