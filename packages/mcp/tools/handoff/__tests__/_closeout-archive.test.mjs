/** Archive side of the closeout: index retirement, the ADR outcome, preview. */
import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { buildHandoff } from "../_build.js";
import { archiveCompletedDocs } from "../_closeout.js";
import { AUTHOR, seed } from "./_closeout.fixture.mjs";

test("archive retires the plan from the indexes before deleting it", () => {
  const dir = seed();
  const index = [
    "| Group | Path | Status | Open work |",
    "| ----- | ---- | ------ | --------- |",
    "| done | `done.md` | `planned` | own graph |",
    "",
    "### WS-D - Single-document tracks",
    "",
    "- [ ] [`done.md`](done.md) - own graph.",
    "",
  ].join("\n");

  writeFileSync(join(dir, "docs/plans/plan-of-plans.md"), index);

  const { archived } = archiveCompletedDocs(dir, { author: AUTHOR });
  const retired = archived.find((doc) => doc.kind === "plans" && doc.name === "done");
  const patched = readFileSync(join(dir, "docs/plans/plan-of-plans.md"), "utf8");

  assert.match(patched, new RegExp(`done → ADR ${retired.adrNumber}`), "the row names the ADR");
  assert.match(patched, /^- \[x\] \[`done\.md`\]\(done\.md\) - own graph; retired → \[ADR \d+\]/m, "the workstream box is closed");
  assert.equal(existsSync(join(dir, "docs/plans/done.md")), false, "the source still leaves");

  rmSync(dir, { recursive: true, force: true });
});

test("the archived ADR names the outcome, not just the count", () => {
  const dir = seed();
  const { archived } = archiveCompletedDocs(dir, { author: AUTHOR });
  const body = readFileSync(join(dir, "docs/adr", archived[0].adrFile), "utf8");

  assert.match(body, /^## Outcome$/m, "the record carries what it delivered");
  assert.match(body, /Step 1: first\./, "the closed steps are named");

  rmSync(dir, { recursive: true, force: true });
});

test("preview lists the closeout and writes nothing", () => {
  const dir = seed();
  const { archived, skipped, preview } = archiveCompletedDocs(dir, { author: AUTHOR, apply: false });

  assert.equal(preview, true);
  assert.equal(archived.length, 3, "the report names every candidate");
  assert.deepEqual(
    archived.map((doc) => doc.adrNumber),
    [1, 2, 3],
    "each candidate gets its own prospective number",
  );
  assert.deepEqual(skipped, []);
  assert.equal(existsSync(join(dir, "docs/plans/done.md")), true, "the source is kept");
  assert.equal(existsSync(join(dir, "docs/adr/done.md")), false, "no ADR is written");
  assert.equal(readdirSync(join(dir, "docs/adr")).length, 0, "the ADR directory stays empty");

  rmSync(dir, { recursive: true, force: true });
});

test("closeout preview through the builder writes nothing either", () => {
  const root = seed();

  try {
    const built = buildHandoff({ projectDir: root, closeout: "preview", maxTokens: 0, format: "full" });

    assert.match(built.text, /### Closeout \(preview\)/, "the section is labeled a preview");
    assert.match(built.text, /Would archive `docs\/plans\/done\.md`/, "the plan is named");
    assert.ok(!built.text.includes("source file deleted"), "nothing claims to be deleted");
    assert.equal(built.stats.archived, 3, "the count describes the candidates");
    assert.equal(existsSync(join(root, "docs/plans/done.md")), true, "the source stays");
    assert.equal(readdirSync(join(root, "docs/adr")).length, 0, "no ADR is written");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("closeout false is a read-only diagnosis in every mode", () => {
  for (const mode of ["close-session", "handoff"]) {
    const root = seed();
    const built = buildHandoff({ projectDir: root, mode, closeout: false, maxTokens: 0, format: "full" });

    assert.doesNotMatch(built.text, /### Closeout/, `${mode} renders no closeout section`);
    assert.equal(built.stats.archived, 0, `${mode} archives nothing`);
    assert.equal(existsSync(join(root, "docs/plans/done.md")), true, `${mode} deletes nothing`);
    assert.equal(readdirSync(join(root, "docs/adr")).length, 0, `${mode} writes no ADR`);
    rmSync(root, { recursive: true, force: true });
  }
});

test("a retired plan leaves one handoff of its own", () => {
  const dir = seed();
  const { archived } = archiveCompletedDocs(dir, { author: AUTHOR });
  const plan = archived.find((doc) => doc.kind === "plans");

  assert.ok(plan.handoffPath, "the report names the per-plan handoff");
  assert.equal(existsSync(join(dir, plan.handoffPath)), true, "the handoff is written");

  const body = readFileSync(join(dir, plan.handoffPath), "utf8");

  assert.match(body, /## Delivered/, "it records what the plan delivered");
  assert.match(body, new RegExp(`ADR\\*\\*: ${String(plan.adrNumber).padStart(3, "0")}`), "it points at the ADR that holds the decision");

  rmSync(dir, { recursive: true, force: true });
});

test("preview names the per-plan handoff and writes none", () => {
  const dir = seed();
  const { archived } = archiveCompletedDocs(dir, { author: AUTHOR, apply: false });
  const plan = archived.find((doc) => doc.kind === "plans");

  assert.match(plan.handoffPath, /^docs\/handoff\/plans\/.+\.md$/, "the prospective path is reported");
  assert.equal(existsSync(join(dir, plan.handoffPath)), false, "preview writes no handoff");

  rmSync(dir, { recursive: true, force: true });
});

test("the handoff carries the plan graph", () => {
  const dir = seed();
  const result = buildHandoff({ projectDir: dir, closeout: false });

  assert.match(result.text, /### Plan graph/, "the section renders on every handoff");
  assert.match(result.text, /- ready: \d+/, "the cascade is counted");
  assert.match(result.text, /- cycles: \d+/, "the graph health is stated");

  rmSync(dir, { recursive: true, force: true });
});
