/** Retiring a finished plan from the indexes that ordered it. */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { retireFromPlanIndexes, retireFromPlanOfPlans, retireFromSkillsPlan } from "../_plan-index.js";

const INDEX = [
  "# plan-of-plans",
  "",
  "| Group | Path | Status | Open work |",
  "| ----- | ---- | ------ | --------- |",
  "| this index | `plan-of-plans.md` | `in-progress` | ordering |",
  "| scripts layout | `_scripts-mcp-layout.md` | `planned` | own graph |",
  "",
  "### WS-D - Single-document tracks",
  "",
  "- [ ] [`_scripts-mcp-layout.md`](_scripts-mcp-layout.md) - own graph.",
  "",
  "## 4 - Dependency graph",
  "",
  "```",
  "rel/v0.1.0",
  "├── WS-D  single tracks",
  "│   ├── export ......................... done → ADR 199",
  "│   └── _scripts-mcp-layout.md",
  "```",
  "",
  "### WS-D - Single-document tracks (detail)",
  "",
  "Plan: [`_scripts-mcp-layout.md`](_scripts-mcp-layout.md)",
  "",
].join("\n");

const ENTRY = {
  filename: "_scripts-mcp-layout.md",
  label: "scripts layout",
  adrNumber: 205,
  adrFile: "205-close-out-plan-scripts-mcp-layout.md",
};

test("retiring rewrites the snapshot row, the checkbox, the graph leaf and the plan link", () => {
  const { text, changed } = retireFromPlanOfPlans(INDEX, ENTRY);

  assert.equal(changed, true);
  assert.match(text, /\| scripts layout \| _\(retired\)_ \| done → ADR 205 \| own graph \|/, "the row points at the ADR");
  assert.match(
    text,
    /^- \[x\] \[`_scripts-mcp-layout\.md`\]\(_scripts-mcp-layout\.md\) - own graph; retired → \[ADR 205\]\(\.\.\/adr\/205-close-out-plan-scripts-mcp-layout\.md\)\.$/m,
    "the workstream box is closed and keeps its description",
  );
  assert.match(text, /^│   └── scripts layout \.\.\. done → ADR 205$/m, "the graph leaf names the closeout");
  assert.match(text, /^Plan: retired → \[ADR 205\]\(\.\.\/adr\/205-close-out-plan-scripts-mcp-layout\.md\)$/m, "the plan link is retired");
  assert.doesNotMatch(text, /_scripts-mcp-layout\.md`\]\(_scripts-mcp-layout\.md\) - own graph\./, "the open item is gone");
});

test("retiring twice is a no-op the second time", () => {
  const once = retireFromPlanOfPlans(INDEX, ENTRY);
  const twice = retireFromPlanOfPlans(once.text, ENTRY);

  assert.equal(twice.changed, false, "nothing left open to rewrite");
  assert.equal(twice.text, once.text);
});

test("retiring a plan the index never listed changes nothing", () => {
  const { text, changed } = retireFromPlanOfPlans(INDEX, { ...ENTRY, filename: "_absent.md" });

  assert.equal(changed, false);
  assert.equal(text, INDEX);
});

test("a skills-plan progress row retires by node id", () => {
  const catalog = [
    "# skills-plan",
    "",
    "| Node | Area | Status | box | Stage |",
    "| ---- | ---- | ------ | --- | ----- |",
    "| `rule-process-cargo-release` | leaf | done | 19/19 | 2 |",
    "| `rule-process-ai` | leaf | in-progress | 10/22 | 0 |",
    "",
  ].join("\n");

  const { text, changed } = retireFromSkillsPlan(catalog, {
    filename: "skills/process/_rule-mcp-process-cargo-release.md",
    nodeId: "rule-process-cargo-release",
    label: "rule-process-cargo-release",
    adrNumber: 210,
    adrFile: "210-close-out-plan-rule-mcp-process-cargo-release.md",
  });

  assert.equal(changed, true);
  assert.match(text, /^\| `rule-process-cargo-release` \| leaf \| retired \| 19\/19 \| 2 \|$/m);
  assert.match(text, /^\| `rule-process-ai` \| leaf \| in-progress \|/m, "other rows are untouched");
});

test("the project patch retires from both indexes and leaves absent files alone", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-plan-index-"));

  mkdirSync(join(root, "docs/plans/skills"), { recursive: true });
  writeFileSync(join(root, "docs/plans/plan-of-plans.md"), INDEX);
  writeFileSync(
    join(root, "docs/plans/skills/_skills-plan.md"),
    "| Node | Area | Status | box | Stage |\n| --- | --- | --- | --- | --- |\n| `scripts-layout` | leaf | done | 3/3 | 2 |\n",
  );

  const patched = retireFromPlanIndexes(root, { ...ENTRY, nodeId: "scripts-layout" });

  assert.equal(patched.changed, true);
  assert.deepEqual(patched.files, ["docs/plans/plan-of-plans.md", "docs/plans/skills/_skills-plan.md"]);
  assert.match(readFileSync(join(root, "docs/plans/plan-of-plans.md"), "utf8"), /done → ADR 205/);
  assert.match(readFileSync(join(root, "docs/plans/skills/_skills-plan.md"), "utf8"), /\| retired \|/, "the skills catalog retires the node");

  rmSync(root, { recursive: true, force: true });
});
