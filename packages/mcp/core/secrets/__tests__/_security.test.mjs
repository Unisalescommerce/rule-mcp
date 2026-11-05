/** Regression tests for offline scanning and complete revision coverage. */
import assert from "node:assert/strict";
import test from "node:test";
import { scanPatch, rangeDiffArgs, parseReport } from "../index.js";

test("provider requests are explicitly disabled despite inherited environment", () => {
  let args;
  scanPatch("diff --git a/x b/x\n", {
    exec: (_, flags) => {
      args = flags;

      return "[]";
    },
  });
  assert.ok(args.includes("--validate=false"));
  assert.ok(args.includes("--analyze=false"));
});

test("a revision scan walks commit patches rather than comparing endpoints", () => {
  const args = rangeDiffArgs("base..HEAD");

  assert.equal(args[0], "log");
  assert.ok(args.includes("-p"));
  assert.ok(args.includes("--root"));
  assert.ok(args.includes("--diff-merges=first-parent"));
  assert.ok(args.includes("--no-ext-diff"));
  assert.ok(args.includes("--no-textconv"));
  assert.equal(args.at(-1), "--");
});

test("option-shaped revisions are rejected", () => {
  assert.throws(() => rangeDiffArgs("--all"), /revision/i);
});

test("incomplete scan metadata cannot report a clean scan", () => {
  assert.throws(() => parseReport(JSON.stringify({ findings: [], scan: { state: "incomplete" } })), /incomplete/);
});
