/**
@module test/export/decision-cache/heuristics

Step 4.1: flag dubious decisions for interview.
*/

import { strict as assert } from "node:assert";
import test from "node:test";

const { flagDubious } = await import("../index.js");

test("ADR tool calls are dubious", () => {
  const flags = flagDubious({
    events: [{ tool: "rule_tool_process_adr", ok: true }],
  });

  assert.ok(flags.some((flag) => flag.reason === "adr-write"));
});

test("conflicting choices on the same fingerprint are dubious", () => {
  const flags = flagDubious({
    candidates: [
      { fingerprint: "fp", choice: "A" },
      { fingerprint: "fp", choice: "B" },
    ],
  });

  assert.ok(flags.some((flag) => flag.reason === "conflict"));
});

test("explicit KEEP/REJECT markers are dubious for interview", () => {
  const flags = flagDubious({ text: "Please KEEP this routing decision" });

  assert.ok(flags.some((flag) => flag.reason === "explicit-marker"));
});

test("quiet input yields no flags", () => {
  assert.deepEqual(flagDubious({ events: [{ tool: "rule_tool_stats" }], text: "hello" }), []);
});
