/**
The closeout ADR is the record that survives the deleted plan, so a step it
carries must be the whole step. A wrapped checkbox kept only its first line,
and the prose that explained the plan was dropped entirely.
*/
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { closedSteps, planProse } from "../_closeout-scan.js";
import { archiveCompletedDocs } from "../_closeout.js";

const PLAN = `# Plan: example

Status: \`done\`.

## Dependency graph

\`\`\`
WS1 --> WS2
\`\`\`

A paragraph that explains why the plan exists at all.

- [x] **WS1-T1**: Port the scanner into
      \`packages/mcp/core/example.js\` and keep the
      identifier the caller already uses.
- [x] **WS1-T2**: Wire it.

Another paragraph, with the reasoning a reader will need later.
`;

test("a wrapped step is kept whole", () => {
  const steps = closedSteps(PLAN);

  assert.equal(steps.length, 2);
  assert.match(steps[0], /Port the scanner into packages\/mcp\/core\/example\.js and keep the identifier the caller already uses\./);
});

test("plan prose that is not a checkbox is kept, and the graph is not prose", () => {
  const prose = planProse(PLAN);

  assert.ok(prose.some((line) => line.includes("why the plan exists at all")));
  assert.ok(prose.some((line) => line.includes("reasoning a reader will need later")));
  assert.ok(
    prose.every((line) => !line.includes("WS1 --> WS2")),
    "a fenced graph is not prose",
  );
  assert.ok(
    prose.every((line) => !line.startsWith("Status:")),
    "the status line is metadata",
  );
});

test("the archived ADR carries whole steps and the plan prose", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-closeout-outcome-"));

  try {
    mkdirSync(join(root, "docs", "plans"), { recursive: true });
    writeFileSync(join(root, "docs", "plans", "_example.md"), PLAN);

    const { archived } = archiveCompletedDocs(root, { author: "Test <test@example.com>" });
    const body = readFileSync(join(root, "docs", "adr", archived[0].adrFile), "utf8");

    assert.match(body, /keep the identifier the caller already uses\./, "the step is not cut at its first line");
    assert.match(body, /why the plan exists at all/, "the prose survives the deletion");
    assert.match(body, /reasoning a reader will need later/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
