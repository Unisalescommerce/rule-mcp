/**
 * WS0: durable development plans land under docs/plans/_*.md and register
 * in plan-of-plans.md. Host CreatePlan paths are out of scope.
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { normalizePlanSlug, writeDevelopmentPlan } from "../_write.js";
import { scanDevelopmentPlanShape } from "../_shape.js";
import { seed, validBody } from "./_write.fixture.mjs";

test("normalizePlanSlug requires a leading underscore and a single segment", () => {
  assert.deepEqual(normalizePlanSlug("scripts-layout"), { ok: true, slug: "_scripts-layout", filename: "_scripts-layout.md" });
  assert.deepEqual(normalizePlanSlug("_scripts-layout.md"), { ok: true, slug: "_scripts-layout", filename: "_scripts-layout.md" });
  assert.equal(normalizePlanSlug("nested/nope").ok, false);
  assert.equal(normalizePlanSlug("nope.md").ok, true);
  assert.equal(normalizePlanSlug("").ok, false);
});

test("writeDevelopmentPlan creates docs/plans/_slug.md with Status and Dependency graph", () => {
  const dir = seed();
  const result = writeDevelopmentPlan({ projectDir: dir, slug: "example-track", title: "example track", body: validBody() });

  assert.equal(result.ok, true);
  assert.equal(result.path, "docs/plans/_example-track.md");

  const written = readFileSync(join(dir, result.path), "utf8");

  assert.match(written, /^Status:\s*`planned`/m);
  assert.match(written, /^## Dependency graph/m);
  assert.equal(scanDevelopmentPlanShape(written).ok, true);

  const index = readFileSync(join(dir, "docs/plans/plan-of-plans.md"), "utf8");

  assert.ok(index.includes("| example track | `_example-track.md` | `planned` |"));
  assert.ok(index.includes("[`_example-track.md`](_example-track.md)"));
  rmSync(dir, { recursive: true, force: true });
});

test("writeDevelopmentPlan rejects a path without underscore after normalize failure", () => {
  const dir = seed();
  const result = writeDevelopmentPlan({ projectDir: dir, slug: "../escape", title: "escape", body: "# bad\n\nStatus: `planned`\n" });

  assert.equal(result.ok, false);
  assert.equal(existsSync(join(dir, "docs/plans/_escape.md")), false);
  rmSync(dir, { recursive: true, force: true });
});

test("writeDevelopmentPlan refuses silent overwrite without overwrite:true", () => {
  const dir = seed();
  const first = writeDevelopmentPlan({ projectDir: dir, slug: "_keep", title: "keep", body: validBody({ title: "keep", workstream: "WS1 — A", task: "a" }) });

  assert.equal(first.ok, true);

  const second = writeDevelopmentPlan({ projectDir: dir, slug: "_keep", title: "keep", body: "# overwritten\n\nStatus: `planned`\n" });

  assert.equal(second.ok, false);
  assert.match(String(second.error), /overwrite/i);
  assert.match(readFileSync(join(dir, first.path), "utf8"), /^# Plan: keep/m);

  const forced = writeDevelopmentPlan({
    projectDir: dir,
    slug: "_keep",
    title: "keep",
    body: validBody({ title: "keep v2", status: "in-progress", workstream: "WS1 — A", task: "a" }),
    overwrite: true,
  });

  assert.equal(forced.ok, true);
  assert.match(readFileSync(join(dir, first.path), "utf8"), /^# Plan: keep v2/m);
  rmSync(dir, { recursive: true, force: true });
});
