/** Fixtures for the development-plan writer: the level-0 index and a valid body. */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const INDEX = `# plan-of-plans - level-0 orchestration

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

/** A project that already carries the index. */
export function seed() {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-plan-write-"));
  mkdirSync(join(dir, "docs", "plans"), { recursive: true });
  writeFileSync(join(dir, "docs/plans/plan-of-plans.md"), INDEX);

  return dir;
}

/** A body that satisfies the shape: workstream, task, graph, diagram and a link. */
export function validBody({ title = "example track", status = "planned", workstream = "WS1 — Setup", task = "scaffold" } = {}) {
  return [
    `# Plan: ${title}`,
    "",
    `Status: \`${status}\``,
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
    "### " + workstream,
    "",
    `- [ ] **WS1-T1**: ${task}`,
    "",
    "- [plan-of-plans](plan-of-plans.md)",
  ].join("\n");
}
