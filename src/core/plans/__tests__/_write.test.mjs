/**
 * WS0: durable development plans land under docs/plans/_*.md and register
 * in plan-of-plans.md. Host CreatePlan paths are out of scope.
 */
import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { normalizePlanSlug, writeDevelopmentPlan } from "../_write.js";
import { scanDevelopmentPlanShape } from "../_shape.js";

const INDEX = `# plan-of-plans - level-0 orchestration

Status: \`in-progress\`

## 1 - Snapshot

| Group | Path | Status | Open work |
| ----- | ---- | ------ | --------- |
| this index | \`plan-of-plans.md\` | \`in-progress\` | ordering |
| decision models | \`_decision-models.md\` | \`planned\` | own graph |

## 5 - Workstreams

### WS-D — Single-document tracks

- [ ] [\`_decision-models.md\`](_decision-models.md) — own dependency graph.
`;

function seed() {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-plan-write-"));
  mkdirSync(join(dir, "docs", "plans"), { recursive: true });
  writeFileSync(join(dir, "docs/plans/plan-of-plans.md"), INDEX);
  return dir;
}

test("normalizePlanSlug requires a leading underscore and a single segment", () => {
  assert.deepEqual(normalizePlanSlug("scripts-layout"), {
    ok: true,
    slug: "_scripts-layout",
    filename: "_scripts-layout.md",
  });
  assert.deepEqual(normalizePlanSlug("_scripts-layout.md"), {
    ok: true,
    slug: "_scripts-layout",
    filename: "_scripts-layout.md",
  });
  assert.equal(normalizePlanSlug("nested/nope").ok, false);
  assert.equal(normalizePlanSlug("nope.md").ok, true);
  assert.equal(normalizePlanSlug("").ok, false);
});

test("writeDevelopmentPlan creates docs/plans/_slug.md with Status and Dependency graph", () => {
  const dir = seed();
  const body = [
    "# Plan: example track",
    "",
    "Status: `planned`",
    "",
    "## Dependency graph",
    "",
    "```",
    "WS1 --> WS2",
    "```",
    "",
    "Depends on: -",
    "",
    "Feeds: -",
    "",
    "Shared files: -",
    "",
    "### WS1 — Setup",
    "",
    "- [ ] **WS1-T1**: scaffold",
  ].join("\n");

  const result = writeDevelopmentPlan({
    projectDir: dir,
    slug: "example-track",
    title: "example track",
    body,
  });

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
  const result = writeDevelopmentPlan({
    projectDir: dir,
    slug: "../escape",
    title: "escape",
    body: "# bad\n\nStatus: `planned`\n",
  });
  assert.equal(result.ok, false);
  assert.equal(existsSync(join(dir, "docs/plans/_escape.md")), false);
  rmSync(dir, { recursive: true, force: true });
});

test("writeDevelopmentPlan refuses silent overwrite without overwrite:true", () => {
  const dir = seed();
  const first = writeDevelopmentPlan({
    projectDir: dir,
    slug: "_keep",
    title: "keep",
    body: [
      "# keep",
      "",
      "Status: `planned`",
      "",
      "## Dependency graph",
      "",
      "```",
      "WS1",
      "```",
      "",
      "Depends on: -",
      "",
      "Feeds: -",
      "",
      "Shared files: -",
      "",
      "### WS1 — A",
      "",
      "- [ ] **WS1-T1**: a",
    ].join("\n"),
  });
  assert.equal(first.ok, true);

  const second = writeDevelopmentPlan({
    projectDir: dir,
    slug: "_keep",
    title: "keep",
    body: "# overwritten\n\nStatus: `planned`\n",
  });
  assert.equal(second.ok, false);
  assert.match(String(second.error), /overwrite/i);
  assert.match(readFileSync(join(dir, first.path), "utf8"), /^# keep/m);

  const forced = writeDevelopmentPlan({
    projectDir: dir,
    slug: "_keep",
    title: "keep",
    body: [
      "# keep v2",
      "",
      "Status: `in-progress`",
      "",
      "## Dependency graph",
      "",
      "```",
      "WS1",
      "```",
      "",
      "Depends on: -",
      "",
      "Feeds: -",
      "",
      "Shared files: -",
      "",
      "### WS1 — A",
      "",
      "- [ ] **WS1-T1**: a",
    ].join("\n"),
    overwrite: true,
  });
  assert.equal(forced.ok, true);
  assert.match(readFileSync(join(dir, first.path), "utf8"), /^# keep v2/m);
  rmSync(dir, { recursive: true, force: true });
});
