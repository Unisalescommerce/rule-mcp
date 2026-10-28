/**
@module test/runtime/features/tokensave-levels

Tokensave is the one feature whose default is not a constant: whether the
integration has anything to do depends on the project. Two things are pinned
here - the third level answers to `on+autotrack` as well as to its canonical
name, and with no choice recorded the level follows the project's graph instead
of claiming "on" everywhere.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { envPatchFor, levelsFor } from "../_catalog.data.js";
import { resolveRequestedLevel } from "../_apply.js";
import { readLevel } from "../_readers.js";

const withGraph = mkdtempSync(join(tmpdir(), "rule-tokensave-graph-"));
mkdirSync(join(withGraph, ".tokensave"));
const withoutGraph = mkdtempSync(join(tmpdir(), "rule-tokensave-plain-"));

test.after(() => {
  rmSync(withGraph, { recursive: true, force: true });
  rmSync(withoutGraph, { recursive: true, force: true });
});

test("on+autotrack is another name for the autotrack level, not a fourth level", () => {
  assert.deepEqual(envPatchFor("tokensave", "on+autotrack"), envPatchFor("tokensave", "autotrack"));
  assert.equal(resolveRequestedLevel("tokensave", "on+autotrack"), "autotrack");
  assert.deepEqual(levelsFor("tokensave"), ["on", "autotrack", "off"]);
});

test("an unknown token fails instead of landing on a level", () => {
  assert.throws(() => resolveRequestedLevel("tokensave", "autotracking"), /Unknown level/);
});

test("with no choice recorded, the level follows the project graph", () => {
  assert.equal(readLevel("tokensave", {}, { projectDir: withGraph }), "on");
  assert.equal(readLevel("tokensave", {}, { projectDir: withoutGraph }), "off");
});

test("a recorded choice outranks the project, in both directions", () => {
  assert.equal(readLevel("tokensave", { RULE_MCP_NO_TOKENSAVE: "0" }, { projectDir: withoutGraph }), "on");
  assert.equal(readLevel("tokensave", { RULE_MCP_TOKENSAVE_AUTOTRACK: "1" }, { projectDir: withoutGraph }), "autotrack");
  assert.equal(readLevel("tokensave", { RULE_MCP_NO_TOKENSAVE: "1" }, { projectDir: withGraph }), "off");
});
