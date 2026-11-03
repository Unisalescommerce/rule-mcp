/**
@module tools/handoff/closeout-handoff

One handoff per retired plan: the record that the plan closed, what it
delivered, and where its decision now lives. The ADR carries the decision;
this file carries the closure, so a reader who looks for a plan finds both.
*/
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Where per-plan handoffs live, relative to the project root. */
export const PLAN_HANDOFF_DIR = "docs/handoff/plans";

/** The file name of a plan's handoff: the plan name, readable and stable. */
export function planHandoffName(doc) {
  const stem = doc.name
    .replace(/^_/, "")
    .replace(/^rule-mcp-/, "rule-")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");

  return `${stem || "plan"}.md`;
}

/** The per-plan handoff document. */
export function planHandoffBody({ doc, number, adrFile, steps, date }) {
  return [
    `# ${doc.name.replace(/^_/, "")}`,
    "",
    `- **Plan**: \`${doc.path}\` (retired${date ? ` on ${date}` : ""})`,
    `- **ADR**: ${String(number).padStart(3, "0")} (\`${adrFile}\`)`,
    "",
    "## Delivered",
    "",
    ...steps.map((step) => `- ${step}`),
    "",
    "## Where it lives now",
    "",
    "The ADR holds the decision and its consequences. This file records that the",
    "plan closed and what it delivered; nothing in it is open.",
    "",
  ].join("\n");
}

/** Write the handoff beside the plans it retires. */
export function writePlanHandoff(projectDir, handoff) {
  mkdirSync(join(projectDir, PLAN_HANDOFF_DIR), { recursive: true });
  const file = join(projectDir, PLAN_HANDOFF_DIR, planHandoffName(handoff.doc));

  writeFileSync(file, planHandoffBody(handoff));

  return `${PLAN_HANDOFF_DIR}/${planHandoffName(handoff.doc)}`;
}
