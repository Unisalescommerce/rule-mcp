/**
@module test/handon/files-compared-from-the-range-end

A handoff that fixes its range end also fixes the moment it was written: the
work it describes sits before that commit. Comparing each file it names from
the range *start* counted the handoff's own commits as changes made after it,
so every file the session had just committed came back "modified since" - the
line a reader is told to re-read before trusting the narrative. The trunk case
only looked right because the fixture's range ends at HEAD, where there is no
end to compare from.

@see ADR 052 - why handon verifies rather than summarizes
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git, write } from "./_handon.fixture.mjs";
import { handon } from "../index.js";

/** A repository whose handoff fixed its range end, with one file after it. */
function fixedEndRepository() {
  const root = mkdtempSync(join(tmpdir(), "rule-handon-end-"));
  git(root, "init", "--initial-branch=main", "-q");
  git(root, "config", "user.email", "fixture@example.com");
  git(root, "config", "user.name", "Fixture");

  write(root, "src/listed.js", "export const listed = 1;\n");
  write(root, "src/later.js", "export const later = 1;\n");
  git(root, "add", "-A");
  git(root, "commit", "-qm", "chore(fixture): initial");
  const start = git(root, "rev-parse", "HEAD");

  // The handoff's own window: it commits the files it names.
  write(root, "src/listed.js", "export const listed = 2;\n");
  git(root, "add", "-A");
  git(root, "commit", "-qm", "refactor(fixture): work the handoff describes");
  const end = git(root, "rev-parse", "HEAD");

  // After the handoff was written.
  write(root, "src/later.js", "export const later = 2;\n");
  git(root, "add", "-A");
  git(root, "commit", "-qm", "refactor(fixture): move on after the handoff");

  write(
    root,
    "docs/handoff/09-fixed-end.md",
    [
      "# Handoff 09: a fixed range end",
      "",
      `- **Branch**: \`main\``,
      `- **Range**: \`${start.slice(0, 7)}..${end.slice(0, 7)}\``,
      `- **Date**: 2026-10-28`,
      "",
      "Work in flight touches `src/listed.js` and `src/later.js`.",
      "",
    ].join("\n"),
  );
  git(root, "add", "-A");
  git(root, "commit", "-qm", "chore(handoff): add session handoff 09");

  return { root, start, end };
}

const { root } = fixedEndRepository();
const report = handon({ projectDir: root });

process.on("exit", () => rmSync(root, { recursive: true, force: true }));

const verdictOf = (path) => report.claims.find((claim) => claim.kind === "file" && claim.value === path)?.verdict;

test("a file the handoff's own range committed is not reported as modified after it", () => {
  assert.equal(verdictOf("src/listed.js"), "unchanged", `the range end is where the handoff stopped counting: ${verdictOf("src/listed.js")}`);
});

test("a file that changed after the range ended is reported as modified", () => {
  assert.equal(verdictOf("src/later.js"), "modified since");
});
