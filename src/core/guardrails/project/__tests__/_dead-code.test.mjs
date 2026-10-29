/**
@module test/guardrails/project/dead-code

The dead-code guardrail counts what the graph can decide. A function reached
through a table, a run-time import or a test has no edge, and calling it dead is
how a guardrail stops being read.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { deadSymbols, isTrulyDead } from "../_dead-code.js";

const project = mkdtempSync(join(tmpdir(), "rule-dead-code-"));

const write = (path, body) => {
  mkdirSync(join(project, path, ".."), { recursive: true });
  writeFileSync(join(project, path), body);
};

test.after(() => rmSync(project, { recursive: true, force: true }));

write("src/live.js", ["function unusedInternal() {", "  return 1;", "}", "export function used() {", "  return unusedInternal();", "}", ""].join("\n"));
write("src/api.js", ["function exportedButUncalled() {", "  return 2;", "}", "", "export { exportedButUncalled };", ""].join("\n"));
write("src/tests/helpers.test.mjs", ["function helperOnlyForTests() {", "  return 3;", "}", ""].join("\n"));

test("a function nobody exports, calls or tests is dead", () => {
  write("src/dead.js", ["function trulyDead() {", "  return 4;", "}", ""].join("\n"));

  assert.equal(isTrulyDead({ file: "src/dead.js", name: "trulyDead" }, project), true);
});

test("an exported symbol is public, so the graph cannot call it dead", () => {
  assert.equal(isTrulyDead({ file: "src/api.js", name: "exportedButUncalled" }, project), false);
});

test("a symbol its own file calls is alive", () => {
  assert.equal(isTrulyDead({ file: "src/live.js", name: "unusedInternal" }, project), false);
});

test("a test helper is an entry point, not dead code", () => {
  assert.equal(isTrulyDead({ file: "src/tests/helpers.test.mjs", name: "helperOnlyForTests" }, project), false);
});

test("a file the disk does not have is a stale index, not a finding", () => {
  assert.equal(isTrulyDead({ file: "src/gone.js", name: "anything" }, project), false);
});

test("the filter keeps only what it can prove, from one tool answer", () => {
  const kept = deadSymbols(
    {
      dead_code_count: 4,
      symbols: [
        { file: "src/dead.js", name: "trulyDead" },
        { file: "src/api.js", name: "exportedButUncalled" },
        { file: "src/live.js", name: "unusedInternal" },
        { file: "src/tests/helpers.test.mjs", name: "helperOnlyForTests" },
      ],
    },
    project,
  );

  assert.deepEqual(kept.map((symbol) => symbol.name), ["trulyDead"], "one of the four is dead");
});
