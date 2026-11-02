/**
 * @module tools/handoff/plan-index
 *
 * Retiring a finished plan from the indexes that ordered it.
 *
 * Closeout turns a completed plan into an ADR and deletes the source, so every
 * index that still names that source would point at a file that no longer
 * exists. This module rewrites those lines at the same moment: the snapshot row,
 * the workstream checkbox, the dependency-graph leaf and the plan link in
 * `plan-of-plans.md`, and the progress row in `skills/_skills-plan.md`.
 *
 * The rewrite is conservative: only a structured line that names the exact file
 * or node id changes. Prose that mentions the plan stays as history.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { PLAN_OF_PLANS, SKILLS_PLAN, basename } from "./_plan-index-shape.js";
import { mapLines, patchCheckbox, patchGraphLeaf, patchPlanLink, patchProgressRow, patchSnapshotRow } from "./_plan-index-lines.js";

/** The node id of a plan path (ADR 153): strip `_`, then `rule-mcp-` → `rule-`. */
export function planNodeId(filename) {
  return basename(filename)
    .replace(/\.md$/, "")
    .replace(/^_/u, "")
    .replace(/^rule-mcp-/u, "rule-");
}

/**
 * Retire a plan from the level-0 index.
 *
 * @param {string} text
 * @param {{ filename: string, label: string, adrNumber: number, adrFile: string }} entry
 * @returns {{ text: string, changed: boolean }}
 */
export function retireFromPlanOfPlans(text, entry) {
  return mapLines(text, [
    (line) => patchSnapshotRow(line, entry.filename, entry.adrNumber),
    (line) => patchCheckbox(line, entry),
    (line) => patchGraphLeaf(line, entry),
    (line) => patchPlanLink(line, entry),
  ]);
}

/**
 * Retire a skill plan from the catalog orchestrator.
 *
 * @param {string} text
 * @param {{ filename: string, nodeId?: string, label: string, adrNumber: number, adrFile: string }} entry
 * @returns {{ text: string, changed: boolean }}
 */
export function retireFromSkillsPlan(text, entry) {
  return mapLines(text, [(line) => patchProgressRow(line, entry), (line) => patchGraphLeaf(line, entry)]);
}

/**
 * Write the retirement into every index that exists in the project.
 *
 * @param {string} projectDir
 * @param {{ filename: string, nodeId?: string, label: string, adrNumber: number, adrFile: string }} entry
 * @returns {{ changed: boolean, files: string[] }}
 */
export function retireFromPlanIndexes(projectDir, entry) {
  const files = [];

  for (const [relative, patch] of [
    [PLAN_OF_PLANS, retireFromPlanOfPlans],
    [SKILLS_PLAN, retireFromSkillsPlan],
  ]) {
    const path = join(projectDir, relative);

    if (!existsSync(path)) {
      continue;
    }

    const before = readFileSync(path, "utf8");
    const after = patch(before, entry);

    if (!after.changed) {
      continue;
    }

    writeFileSync(path, after.text);
    files.push(relative);
  }

  return { changed: files.length > 0, files };
}
