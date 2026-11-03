/** The persona plan is a development plan: workstreams, tasks, and its own graph. */
import test from "node:test";
import assert from "node:assert/strict";

import { scanDevelopmentPlanShape } from "../../../plans/_shape.js";
import { planCheckedIds, planFindingIds } from "../_plan-ids.js";
import { renderPlan } from "../_render.js";

const FINDINGS = [
  { id: "SEC-1", severity: "blocker", status: "open", evidence: "line 4", summary: "The token is logged.", steps: ["Remove the log call.", "Add a regression test."] },
  { id: "SEC-2", severity: "high", status: "open", evidence: "line 9", summary: "Missing timeout.", steps: [] },
  { id: "SEC-3", severity: "high", status: "open", evidence: "line 12", summary: "Weak cipher.", steps: [] },
];

test("the persona plan carries the development-plan shape", () => {
  const plan = renderPlan("security", 1, "2026-11-03", FINDINGS);

  assert.equal(scanDevelopmentPlanShape(plan).ok, true, JSON.stringify(scanDevelopmentPlanShape(plan).findings));
});

test("one workstream per severity, in the order the findings arrive", () => {
  const plan = renderPlan("security", 1, "2026-11-03", FINDINGS);

  assert.match(plan, /^### WS1 - blocker$/m, "the blocker is its own workstream");
  assert.match(plan, /^### WS2 - high$/m, "the high findings share the next one");
  assert.match(plan, /^\s*- \[ \] \*\*WS1-T1 - Step 1 - SEC-1 \(blocker\)\*\*/m, "a task id names the workstream and the order");
  assert.match(plan, /^\s*- \[ \] \*\*WS2-T1 - Step 2 - SEC-2 \(high\)\*\*/m, "the second workstream starts its own task numbering");
});

test("a finding's sub-steps become nested tasks", () => {
  const plan = renderPlan("security", 1, "2026-11-03", FINDINGS);

  assert.match(plan, /^\s*- \[ \] \*\*WS1-T1\.1 - 1\.1\*\*: Remove the log call\./m);
  assert.match(plan, /^\s*- \[ \] \*\*WS1-T1\.2 - 1\.2\*\*: Add a regression test\./m);
});

test("the graph section names the workstreams and the edges", () => {
  const plan = renderPlan("security", 1, "2026-11-03", FINDINGS);

  assert.match(plan, /^## Dependency graph$/m);
  assert.match(plan, /WS1 - blocker/);
  assert.match(plan, /Depends on: -/);
  assert.match(plan, /Feeds: -/);
});

test("the marks survive the new shape, step and sub-step alike", () => {
  const plan = renderPlan("security", 1, "2026-11-03", FINDINGS);
  const marked = plan.replace("- [ ] **WS1-T1.1", "- [x] **WS1-T1.1");
  const checked = planCheckedIds(marked);

  assert.ok(checked.has("SEC-1#1"), "a marked sub-step is remembered against its finding");
  assert.deepEqual(planFindingIds(plan), ["SEC-1", "SEC-2", "SEC-3"], "every finding is still named");
});
