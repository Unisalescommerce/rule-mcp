/** Which working papers count as finished, and which files are never papers. */
import { strict as assert } from "node:assert";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { findCompletedDocs } from "../_closeout.js";
import { seed } from "./_closeout.fixture.mjs";

test("only fully completed docs are found, open and orphaned ones are not", () => {
  const dir = seed();
  const found = findCompletedDocs(dir)

    .map((entry) => entry.path)
    .sort();

  assert.deepEqual(found, ["docs/audits/done.md", "docs/plans/done.md", "docs/reviews/done.md"]);
  rmSync(dir, { recursive: true, force: true });
});

test("nested plans close out too, and the index files never do", () => {
  const dir = seed();

  mkdirSync(join(dir, "docs/plans/skills/process"), { recursive: true });
  writeFileSync(join(dir, "docs/plans/skills/process/_rule-mcp-process-npm-release.md"), "# npm release\n\nStatus: `done`\n\n- [x] **Step 1**: shipped.\n");
  writeFileSync(join(dir, "docs/plans/plan-of-plans.md"), "# index\n\nStatus: `done`\n\n- [x] **Step 1**: ordering.\n");
  writeFileSync(join(dir, "docs/plans/README.md"), "# readme\n\nStatus: `done`\n\n- [x] **Step 1**: index.\n");

  const found = new Set(findCompletedDocs(dir)

    .map((entry) => entry.path)
    .sort());

  assert.ok(found.has("docs/plans/skills/process/_rule-mcp-process-npm-release.md"), "a catalog leaf is a plan");
  assert.ok(!found.has("docs/plans/plan-of-plans.md"), "the level-0 index is not work");
  assert.ok(!found.has("docs/plans/README.md"), "an index table is not work");

  rmSync(dir, { recursive: true, force: true });
});

test("a plan needs a done status and no open step, fences do not count", () => {
  const dir = seed();

  writeFileSync(join(dir, "docs/plans/stale.md"), "# stale\n\nStatus: `planned`\n\n- [x] **Step 1**: done.\n");
  writeFileSync(join(dir, "docs/plans/fenced.md"), "# fenced\n\nStatus: `done`\n\n- [x] **Step 1**: done.\n\n```\n- [ ] not a real step\n```\n");

  const found = new Set(findCompletedDocs(dir).map((entry) => entry.path));

  assert.ok(!found.has("docs/plans/stale.md"), "all boxes closed but Status is not done");
  assert.ok(found.has("docs/plans/fenced.md"), "a box inside a fence is not open work");

  rmSync(dir, { recursive: true, force: true });
});
