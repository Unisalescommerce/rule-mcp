/**
@module core/plans/shape

Contract for AI-assisted development plans (ADR 146 amendment / WS3 of
docs/plans/_asd-ste100.md). Persona trio checklists stay finding-shaped
(ADR 59); this scanner applies to product development plans under docs/plans/.
*/

/**
Embeddable guide for generators and persona/operation prompts.
Prefer this over inventing a second wording.
*/
export const DEVELOPMENT_PLAN_SHAPE_GUIDE =
  "Development plans (docs/plans/_*.md) are Markdown: workstreams WS1..WSn (or WS-A when the level-0 index already uses letters), each split into Markdown checkbox tasks WS1-T1 / WSn-Tx.y (and nested WSi-Tj.k), at least one link to a reference file, a ## Dependency graph with a parseable edge list (Depends on: / Feeds: / Shared files: or an edge table) AND a fenced text diagram. One workstream owns a file set; serialize CONFLICT edges. Keep AI execution linear.";

/** Workstream heading: ### WS1, ## WS-A, ### WS1 - title, etc. */
const WORKSTREAM_HEADING = /^#{2,3}\s*WS(?:\d+|[A-Z])\b/m;

/** Task id in a checkbox or bold label: WS1-T1, WS1-T1.1, WS-A-T2 */
const TASK_ID = /\bWS(?:\d+|[A-Z])-T\d+(?:\.\d+)?\b/;

/** A fenced block that can hold the diagram (any info string). */
const FENCED_BLOCK = /```[\w-]*\r?\n[\s\S]*?```/;

/** A Markdown checkbox task, the only form a plan may carry work in. */
const CHECKBOX = /^\s*-\s*\[[ xX]\]\s+\S/m;

/** A link to a file, not an external URL: the plan points at what it reads. */
const REFERENCE_LINK = /\[[^\]]+\]\((?!https?:)[^)]+\)/;

/**
Scan a development-plan markdown body for the WSn / dual-graph contract.

@param {string} text
@returns {{ ok: boolean, findings: Array<{ id: string, detail: string }> }}
*/
export function scanDevelopmentPlanShape(text) {
  const source = typeof text === "string" ? text : "";
  /** @type {Array<{ id: string, detail: string }> } */
  const findings = [];

  if (!/^##\s+Dependency graph\b/m.test(source)) {
    findings.push({ id: "dependency-graph", detail: "missing ## Dependency graph section" });
  }

  if (!WORKSTREAM_HEADING.test(source)) {
    findings.push({ id: "workstream", detail: "missing WSn or WS-A workstream heading" });
  }

  if (!TASK_ID.test(source)) {
    findings.push({ id: "task", detail: "missing WSi-Tj task id" });
  }

  if (!FENCED_BLOCK.test(source)) {
    findings.push({ id: "diagram", detail: "missing fenced dependency diagram" });
  }

  if (!CHECKBOX.test(source)) {
    findings.push({ id: "checkbox", detail: "missing a Markdown checkbox task: - [ ] WSn-Tm" });
  }

  if (!REFERENCE_LINK.test(source)) {
    findings.push({ id: "reference-link", detail: "missing a Markdown link to a reference file" });
  }

  return { ok: findings.length === 0, findings };
}
