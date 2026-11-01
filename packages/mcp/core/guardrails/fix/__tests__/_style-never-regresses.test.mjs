/**
@module test/guardrails/style-never-regresses

`rule-mcp fix` feeds the guardrails, so a fix that adds a violation is worse than
no fix at all: the next check reports the file as failing, the fix reports nothing
left to do, and the two disagree forever.

`js-style` inserted a blank line after the opening brace of a function body, which
is exactly what `js-no-blank-lines-in-blocks` forbids. The fixer now checks its own
output and keeps the original when the count of failing rules went up.
*/

import test from "node:test";
import assert from "node:assert/strict";

import { checkCode } from "../../index.js";
import { applyJsStyle } from "../_js-style.js";
import { loadAllSkills } from "../../../skills/index.js";

await loadAllSkills();

const failing = (text) => checkCode("rule-styleguide-javascript", text, { fileName: "sample.js" }).failCount;

test("a fixed file never fails more rules than the original", () => {
  const source = [

    "export function run(value) {",
    "  const done = (answer) => {",
    "    finish(answer);",
    "    report(answer);",
    "  };",
    "",
    "  return done(value);",
    "}",
    "",
  ].join("\n");

  const fixed = applyJsStyle(source);

  assert.ok(failing(fixed.text) <= failing(source), `the fix must not add a failure: ${failing(source)} -> ${failing(fixed.text)}`);
});

test("the blank the fixer used to insert after an opening brace is not inserted", () => {
  const source = ["const done = (value) => {", "  finish(value);", "  report(value);", "};", ""].join("\n");
  const fixed = applyJsStyle(source).text;

  assert.equal(/\(\s*$|\{\n\n/u.test(fixed), false, "no blank line right after the brace");
  assert.ok(fixed.includes("finish(value);"), "the body survives");
});
