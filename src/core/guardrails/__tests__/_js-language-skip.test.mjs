/**
 * @module test/guardrails/js-language-skip
 *
 * JavaScript baseline rules must not fail non-JS files (handoff 29: .yml;
 * same false positive on .py).
 */

import { strict as assert } from "node:assert";
import test from "node:test";

import { checkCode } from "../index.js";
import "./_install.fixture.mjs";

const PYTHON = `
def greet(name):
    if name:
        return f"hi {name}"
    return "hi"
`;

/** Content that js-if-braces would fail if the language gate were absent. */
const YAML = "if (a) return 1;\n";

test("js-if-braces does not fail a Python file", () => {
  const report = checkCode("rule-styleguide-javascript", PYTHON, { fileName: "greet.py" });
  const hit = report.failed.find((failure) => failure.id === "js-if-braces");

  assert.equal(hit, undefined, "Python if: is not a missing-brace violation");
});

test("js-no-inline-blocks does not fail a Python file", () => {
  const report = checkCode("rule-styleguide-javascript", PYTHON, { fileName: "greet.py" });
  const hit = report.failed.find((failure) => failure.id.startsWith("js-"));

  assert.equal(hit, undefined, "no js-* rule should fail on .py");
});

test("js-* rules do not fail a YAML workflow file", () => {
  const report = checkCode("rule-styleguide-javascript", YAML, {
    fileName: ".github/workflows/release.yml",
  });
  const hit = report.failed.find((failure) => failure.id.startsWith("js-"));

  assert.equal(hit, undefined, "handoff 29: JS rules must not run on .yml");
});

test("js-if-braces still fails braceless JS when fileName is .js", () => {
  const report = checkCode("rule-styleguide-javascript", "if (a) return 1;\n", { fileName: "sample.js" });
  const hit = report.failed.find((failure) => failure.id === "js-if-braces");

  assert.ok(hit, "real JS violations must still fail");
});

test("js-if-braces still runs when fileName is omitted", () => {
  const report = checkCode("rule-styleguide-javascript", "if (a) return 1;\n");
  const hit = report.failed.find((failure) => failure.id === "js-if-braces");

  assert.ok(hit, "pasted JS without a name is still checked");
});
