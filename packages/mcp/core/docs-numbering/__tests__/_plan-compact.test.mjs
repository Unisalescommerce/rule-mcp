/**
The sweep never moves a numbered document; only compaction does.

ADR 219: a closeout numbers pending ADRs at max+1 and leaves every existing
file where it is, so no citation goes stale. Closing the holes is a separate
explicit run. `planRenumber` reports the holes either way, because
`handoff doctor` names them.
*/
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { planRenumber } from "../index.js";

/** A tree with a hole: 001, 002, then 004 and 005. */
function seed() {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-plan-compact-"));

  mkdirSync(join(root, "docs", "adr"), { recursive: true });

  for (const number of ["001", "002", "004", "005"]) {
    writeFileSync(join(root, "docs", "adr", `${number}-decision.md`), `# ${number}: decision\n\n- **Status**: accepted\n`);
  }

  return root;
}

test("a sweep reports the hole and moves nothing", () => {
  const root = seed();

  try {
    const plan = planRenumber({ projectDir: root });

    assert.deepEqual(
      plan.gaps.map((gap) => gap.number),
      ["003"],
      "the hole is named",
    );
    assert.equal(plan.renames.length, 0, "no document moves without compaction");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("compaction moves the documents after the hole down, when asked", () => {
  const root = seed();

  try {
    const plan = planRenumber({ projectDir: root, compact: true });

    assert.deepEqual(
      plan.renames.map((rename) => `${rename.fromNumber}->${rename.toNumber}`),
      ["004->003", "005->004"],
      "everything after the hole moves down by one",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
