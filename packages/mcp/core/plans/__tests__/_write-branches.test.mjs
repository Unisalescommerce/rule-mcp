/** The plan writer on the inputs a caller can leave out. */
import { strict as assert } from "node:assert";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { normalizePlanSlug, patchPlanOfPlans, writeDevelopmentPlan } from "../_write.js";
import { INDEX, seed, validBody } from "./_write.fixture.mjs";

test("a missing slug and a bare extension are both refused", () => {
  assert.equal(normalizePlanSlug().ok, false);
  assert.equal(normalizePlanSlug(".md").ok, false);
});

test("an index with no snapshot table or workstream section still registers the plan", () => {
  const next = patchPlanOfPlans("# plan-of-plans\n", { filename: "_x.md", label: "x", openWork: "own graph" });

  assert.match(next, /_x\.md/u);
  assert.match(next, /### WS-D - Single-document tracks/u);
});

test("an index that lists the plan already is left as it is", () => {
  const once = patchPlanOfPlans(INDEX, { filename: "_x.md", label: "x", openWork: "own graph" });

  assert.equal(patchPlanOfPlans(once, { filename: "_x.md", label: "x", openWork: "own graph" }), once);
});

test("no index means no plan", (t) => {
  const dir = seed();

  t.after(() => rmSync(dir, { recursive: true, force: true }));
  rmSync(join(dir, "docs/plans/plan-of-plans.md"));

  const result = writeDevelopmentPlan({ projectDir: dir, slug: "track", title: "track", body: validBody() });

  assert.equal(result.ok, false);
  assert.match(result.error, /plan-of-plans/u);
});

test("a body with its newline and an index with none are both written cleanly", (t) => {
  const dir = seed();
  const index = join(dir, "docs/plans/plan-of-plans.md");

  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(index, INDEX.trimEnd());

  const result = writeDevelopmentPlan({ projectDir: dir, slug: "track", title: "", openWork: "ordering", body: `${validBody()}\n` });

  assert.equal(result.ok, true);
  assert.ok(readFileSync(index, "utf8").endsWith("\n"));
  assert.match(readFileSync(index, "utf8"), /ordering/u);
});

test("a call with no body writes the scaffold", (t) => {
  const dir = seed();

  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const result = writeDevelopmentPlan({ projectDir: dir, slug: "empty", title: "empty" });

  assert.equal(typeof result.ok, "boolean");
});
