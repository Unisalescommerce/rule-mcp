/**
@module test/guardrails/fix/split-one-liners

A pass that rewrites code has to stop when the code is already right: the
one-liner splitter matched a multi-line block whose body happened to be a single
line, re-indented it, and appended `;` to a line that already ended with one. On
a real file that produced `;;` and never settled, so `rule-mcp fix` reported the
file forever and refused to write it.
*/

import test from "node:test";
import assert from "node:assert/strict";

import { applyJsStyle } from "../_js-style.js";
import { apply as splitOneLiners } from "../_split-one-liners.js";

const settled = (text) => {
  const first = splitOneLiners(text);

  return { first, second: splitOneLiners(first.text) };
};

test("a block whose body is one line but on its own line is left alone", () => {
  const source = ['export function installOrder() {', '  return ["preflight", "profile"];', "}", ""].join("\n");
  const { first, second } = settled(source);

  assert.equal(first.text, source, `a multi-line block is not a one-liner: ${JSON.stringify(first.text)}`);
  assert.equal(second.text, first.text);
});

test("a real one-liner is split once, with one semicolon", () => {
  const source = "function readThing(id) { return lookup(id); }\n";
  const { first, second } = settled(source);

  assert.equal(first.text, "function readThing(id) {\n  return lookup(id);\n}\n", `split: ${JSON.stringify(first.text)}`);
  assert.equal(first.text.includes(";;"), false, "a body that already ends in a semicolon does not get another");
  assert.equal(second.text, first.text, "a second pass changes nothing");
});

test("a body without a semicolon gets exactly one", () => {
  const { first } = settled("function readThing(id) { return lookup(id) }\n");

  assert.match(first.text, /return lookup\(id\);\n/);
  assert.equal(first.text.includes(";;"), false);
});

test("the whole style chain settles on a one-line return inside a block", () => {
  const source = ['export function installOrder() {', '  return ["preflight", "profile"];', "}", ""].join("\n");
  const once = applyJsStyle(source);

  assert.equal(once.text, source, "nothing to change");
  assert.equal(once.changed, false, "and nothing claimed as changed");
});

test("code that only looks like a one-liner inside a string is left alone", () => {
  const source = 'const parts = [\'function f() {\', \'  return 1;\', \'}\', ""].join("\\n");\n';
  const { first } = settled(source);

  assert.equal(first.text, source, `a quoted body is text: ${JSON.stringify(first.text)}`);
});

test("the whole style chain settles on a real one-liner", () => {
  const source = "const readThing = (id) => { return lookup(id); }\n";
  const once = applyJsStyle(source).text;
  const twice = applyJsStyle(once).text;

  assert.equal(twice, once, "the chain is stable");
  assert.equal(once.includes(";;"), false);
});
