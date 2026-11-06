/** The plan section of a handon report, in each shape it can take. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { graphWarnings, planLines } from "../_plan-report.js";

const plan = (over = {}) => ({ name: "track", step: "do it", open: 1, ...over });

test("cycles and unknown edges each read as a warning", () => {
  assert.deepEqual(graphWarnings({ cycles: ["a"], unknown: ["b"] }), ["cycle: a", "unknown edge: b"]);
  assert.deepEqual(graphWarnings({ cycles: [], unknown: [] }), []);
});

test("nothing ready and no warning renders nothing", () => {
  assert.deepEqual(planLines([]), []);
  assert.deepEqual(planLines(), []);
});

test("a minimal surface stays silent", () => {
  assert.deepEqual(planLines([plan()], { isMinimal: true }), []);
});

test("warnings render with no plans", () => {
  assert.match(planLines(undefined, { warnings: ["cycle: a"] }).join("\n"), /\*\*graph\*\*: cycle: a/u);
});

test("a plan shows its date, workstream and open count, and the overflow is counted", () => {
  const many = Array.from({ length: 12 }, (_, index) => plan({ name: `p${index}` }));
  const text = planLines([plan({ date: "2026-11-06", workstream: "WS1", open: 3 }), ...many]).join("\n");

  assert.match(text, /\*\*track\*\* \(2026-11-06\) - WS1: do it \(2 more open step\(s\) in this plan\)/u);
  assert.match(text, /more plan\(s\) are ready/u);
});
