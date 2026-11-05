/** The plan graph: edges, retired dependencies, cascade order and warnings. */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { write } from "./_handon.fixture.mjs";
import { planId, readPlans, retiredPlans } from "../_plan-graph-read.js";
import { cycles, frontier, planGraph, unknownEdges } from "../_plan-graph-order.js";

const PLAN = (id, status, open, depends) =>
  [
    `# ${id}`,
    "",
    `Status: \`${status}\``,
    "",
    "## Steps",
    "",
    ...(open ? ["- [ ] the first open step."] : ["- [x] the closed step."]),
    "",
    `Depends on: ${depends}`,
    "",
    "Feeds: -",
    "",
  ].join("\n");

/** A project with one of every graph shape. */
function seededGraph() {
  const root = mkdtempSync(join(tmpdir(), "rule-handon-graph-"));

  write(root, "docs/plans/_base.md", PLAN("base", "done", false, "-"));
  write(root, "docs/plans/_ready.md", PLAN("ready", "planned", true, "`base` (HARD)"));
  write(root, "docs/plans/_blocked.md", PLAN("blocked", "planned", true, "`ready` (HARD)"));
  write(root, "docs/plans/skills/toolchain/_rule-mcp-toolchain-vite.md", PLAN("rule-mcp-toolchain-vite", "planned", true, "`rule-process-ai` (HARD)"));
  write(root, "docs/plans/_old.md", PLAN("old", "superseded", true, "-"));
  write(root, "docs/plans/_orphan.md", PLAN("orphan", "planned", true, "`nowhere` (HARD)"));
  write(root, "docs/plans/_p.md", PLAN("p", "planned", true, "`q` (HARD)"));
  write(root, "docs/plans/_q.md", PLAN("q", "planned", true, "`p` (HARD)"));
  write(
    root,
    "docs/adr/210-close-out-plan-rule-mcp-process-ai.md",
    ["# 210: Close out plan _rule-mcp-process-ai", "", "## Decision", "", "Fold the record into this ADR.", ""].join("\n"),
  );

  return root;
}

test("a plan id is the file stem without the underscore or the rule-mcp prefix", () => {
  assert.equal(planId("/x/docs/plans/_rule-mcp-process-ai.md"), "rule-process-ai");
  assert.equal(planId("/x/docs/plans/skills/_sample-area.md"), "sample-area");
});

test("every plan under the tree is read, including the skill plans", () => {
  const root = seededGraph();

  try {
    const plans = readPlans(root);

    assert.ok(plans.has("rule-toolchain-vite"), "a nested skill plan is a node");
    assert.equal(plans.get("ready").edges[0].kind, "HARD", "the edge kind is read");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a closeout ADR makes a removed dependency met, not unknown", () => {
  const root = seededGraph();

  try {
    const retired = retiredPlans(root);
    const ready = frontier(readPlans(root), retired);

    assert.ok(retired.has("rule-process-ai"), "the closeout ADR names the retired plan");
    assert.ok(
      ready.some((plan) => plan.id === "rule-toolchain-vite"),
      "a plan whose only prerequisite was retired is ready",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the cascade exposes only work whose hard prerequisites are met", () => {
  const root = seededGraph();

  try {
    const ready = frontier(readPlans(root), retiredPlans(root)).map((plan) => plan.id);

    assert.deepEqual(ready.sort(), ["ready", "rule-toolchain-vite"], "open plans whose hard prerequisites are met; an unknown edge blocks, and a cycle blocks itself");
    assert.ok(!ready.includes("blocked"), "a plan waiting on an open plan is not offered");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a superseded plan is never offered", () => {
  const root = seededGraph();

  try {
    assert.ok(!frontier(readPlans(root), retiredPlans(root)).some((plan) => plan.id === "old"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an edge that names nothing is reported, and a cycle is named", () => {
  const root = seededGraph();

  try {
    const plans = readPlans(root);

    assert.deepEqual(unknownEdges(plans, retiredPlans(root)), ["docs/plans/_orphan.md: nowhere (HARD)"]);
    assert.deepEqual(cycles(plans), ["p -> q -> p"], "the cycle is a readable chain");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the whole analysis returns ready, blocked, unknown and cycles", () => {
  const root = seededGraph();

  try {
    const analysis = planGraph(root);

    assert.ok(analysis.ready.length > 0, "ready work");
    assert.ok(
      analysis.blocked.some((plan) => plan.id === "blocked"),
      "the blocked plan is named",
    );
    assert.equal(analysis.unknown.length, 1, "the unhealthy edge");
    assert.equal(analysis.cycles.length, 1, "the cycle");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
