/**
@module test/handon/base-vs-branch

A handoff header names two different branches: the one the work sits on
(`**Branch**:`) and the trunk it was cut from (`**Base**:`). The second is a
fact about history, not a claim about where the work is. Read as a claim it
said the session ran on `main`, and `firstMove` then sent the next session to
a branch the handoff never worked on - twice, on handoffs 31 and 32.

@see ADR 052 - why handon verifies rather than summarizes
*/

import test from "node:test";
import assert from "node:assert/strict";
import { parseHandoff } from "../_parse.js";
import { firstMove } from "../_report.js";

const header = [
  "# Handoff 33: the base is not a branch",
  "",
  "- **Branch**: `rel/v0.1.0`",
  "- **Commit range**: `5663098e..a92343f6` (2 commits, this handoff excluded)",
  "- **Base**: `main` (merge base `325936e6`); Conventional Commit violations: 0",
  "",
  "A second branch, `feat/never-existed`, holds the spike.",
].join("\n");

test("the trunk a handoff was cut from is not the branch it worked on", () => {
  const claimed = parseHandoff(header);

  assert.ok(!claimed.branches.includes("main"), `the Base line is the trunk, not a working branch: ${claimed.branches.join(", ")}`);
  assert.ok(claimed.branches.includes("rel/v0.1.0"), "the declared branch is still a claim");
});

test("the declared branch is available on its own, apart from the branches a handoff cites", () => {
  assert.equal(parseHandoff(header).declaredBranch, "rel/v0.1.0");
});

test("a cited branch that changed does not become the branch this work was on", () => {
  const claimed = parseHandoff(header);
  const claims = [
    { kind: "branch", value: "rel/v0.1.0", verdict: "current", bucket: "still-true" },
    { kind: "branch", value: "feat/never-existed", verdict: "gone", bucket: "changed" },
  ];

  const move = firstMove(claims, claimed);

  assert.ok(!move.includes("feat/never-existed"), `firstMove proposed a branch the handoff never worked on: ${move}`);
});
