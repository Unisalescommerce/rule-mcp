/** The report for a tree with no collisions, in each way it can still be wrong. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { renderRenumberPlan } from "../_render.js";

const plan = (over = {}) => ({ renames: [], collisions: [], ...over });
const author = { file: "docs/adr/001-x.md", author: "A Person" };

test("a clean tree says so, with or without an author to fix", () => {
  assert.match(renderRenumberPlan(plan()), /Numbering is clean/u);

  const text = renderRenumberPlan(plan({ authors: [author] }));

  assert.match(text, /no author line -> A Person/u);
  assert.match(text, /Run with --fix/u);
  assert.doesNotMatch(renderRenumberPlan(plan({ authors: [author] }), { fix: true }), /Run with --fix/u);
});

test("holes alone are named and carry the authors along", () => {
  assert.match(renderRenumberPlan(plan({ gaps: [{ family: "adr", number: 7 }] })), /sequence has holes/u);
  assert.match(renderRenumberPlan(plan({ gaps: [{ family: "adr", number: 7 }], authors: [author] })), /A Person/u);
});

test("a stale or unordered index is reported by file", () => {
  assert.match(renderRenumberPlan(plan({ indexStale: true })), /docs\/adr\/ADR\.md/u);
  assert.match(renderRenumberPlan(plan({ handoffIndexStale: true })), /docs\/handoff\/HANDOFF\.md/u);
  assert.match(renderRenumberPlan(plan({ indexUnordered: true })), /out of order/u);
  assert.match(renderRenumberPlan(plan({ handoffIndexUnordered: true })), /out of order/u);
});
