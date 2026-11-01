/**
 * @module test/ste100.test
 *
 * Contract for the rule-mcp ASD-STE100 (~80%) writing profile (WS1 of
 * docs/plans/_asd-ste100.md). The profile owns the canonical directive string,
 * the hard/soft rule lists, and a banned-pattern scanner for MCP-authored prose.
 * Generators (WS2) are not wired here.
 */

import { strict as assert } from "node:assert";
import test from "node:test";

import {
  STE100_ANCHOR,
  STE100_DIRECTIVE,
  STE100_HARD_RULES,
  STE100_SOFT_RULES,
  scanSte100Prose,
} from "../directive/_ste100.js";
import { promptDirective, sessionDirective } from "../directive/index.js";

test("canonical STE100~80 directive names the 80% target and the core habits", () => {
  assert.match(STE100_DIRECTIVE, /ASD-STE100/i);
  assert.match(STE100_DIRECTIVE, /80%/);
  assert.match(STE100_DIRECTIVE, /short sentences/i);
  assert.match(STE100_DIRECTIVE, /active voice/i);
  assert.match(STE100_DIRECTIVE, /same word for the same thing/i);
  assert.match(STE100_DIRECTIVE, /20%/);
  assert.match(STE100_DIRECTIVE, /concrete verbs/i);
  assert.equal(STE100_ANCHOR, "STE100~80.");
  assert.ok(/^[ -~]*$/.test(STE100_DIRECTIVE), "directive is plain ASCII");
});

test("hard and soft rule lists are non-empty documented subsets", () => {
  assert.ok(STE100_HARD_RULES.length >= 4, "enough hard STE100-ish rules to enforce");
  assert.ok(STE100_SOFT_RULES.length >= 3, "enough soft natural-tone rules");
  assert.ok(
    STE100_HARD_RULES.some((rule) => /active voice/i.test(rule)),
    "hard rules name active voice",
  );
  assert.ok(
    STE100_HARD_RULES.some((rule) => /same word|synonym/i.test(rule)),
    "hard rules ban synonym churn for key nouns",
  );
  assert.ok(
    STE100_SOFT_RULES.some((rule) => /natural|20%/i.test(rule)),
    "soft rules keep natural tone",
  );
  assert.ok(
    STE100_SOFT_RULES.some((rule) => /slang/i.test(rule)),
    "soft rules ban slang",
  );
});

test("scanSte100Prose flags em dashes, utilize, and stacked hedges", () => {
  const clean = scanSte100Prose("Write the plan. Use short sentences. Keep the same word for the same thing.");
  assert.equal(clean.ok, true);
  assert.deepEqual(clean.findings, []);

  const emDash = scanSte100Prose("Open the file — then save it.");
  assert.equal(emDash.ok, false);
  assert.ok(emDash.findings.some((finding) => finding.id === "em-dash"));

  const utilize = scanSte100Prose("Please utilize the helper before shipping.");
  assert.equal(utilize.ok, false);
  assert.ok(utilize.findings.some((finding) => finding.id === "utilize"));

  const hedge = scanSte100Prose("This might possibly break the build.");
  assert.equal(hedge.ok, false);
  assert.ok(hedge.findings.some((finding) => finding.id === "stacked-hedge"));

  const potential = scanSte100Prose("The change could potentially affect callers.");
  assert.equal(potential.ok, false);
  assert.ok(potential.findings.some((finding) => finding.id === "stacked-hedge"));
});

test("session directive carries the STE100 profile; prompt stays a short re-anchor", () => {
  const session = sessionDirective();
  assert.ok(session.includes(STE100_DIRECTIVE) || session.includes(STE100_ANCHOR), "session names STE100");
  assert.match(session, /STE100|ASD-STE100/);

  const line = promptDirective();
  assert.ok(!line.includes("\n"), "prompt re-anchor is one line");
  assert.ok(line.includes(STE100_ANCHOR) || /STE100/.test(line), "prompt re-anchors STE100");
  assert.ok(line.length <= 120, `prompt must stay <= 120 chars (got ${line.length})`);
});
