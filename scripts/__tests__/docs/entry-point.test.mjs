/**
 * @module scripts/__tests__/docs/entry-point
 *
 * Chapter 01 is the only entry: a reader can install the server and run every
 * flow without reading the engineering guides. The deep guide stays one link
 * away, and the index links the entry point.
 */

import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const DOCS = new URL("../../../docs/", import.meta.url).pathname;
const QUICK = join(DOCS, "01-getting-started.md");

test("the entry point is chapter 01", () => {
  assert.ok(existsSync(QUICK), "docs/01-getting-started.md must exist");
  assert.match(readFileSync(QUICK, "utf8"), /^# /m, "the chapter needs a heading");
});

test("the entry point covers every flow the handbook promises", () => {
  const text = readFileSync(QUICK, "utf8").toLowerCase();

  for (const flow of ["init", "check", "fix", "handoff", "handon", "persona", "cache", "decision"]) {
    assert.ok(text.includes(flow), `the entry point must cover ${flow}`);
  }
});

test("the entry point links to the deep engineering guides", () => {
  const text = readFileSync(QUICK, "utf8");

  assert.match(text, /\]\(\.\/12-engineering-guides\.md\)/u, "the deep guide is one link away");
});

test("the handbook index lists the entry point", () => {
  const index = readFileSync(join(DOCS, "README.md"), "utf8");

  assert.match(index, /01-getting-started\.md/u, "docs/README.md must link chapter 01");
});
