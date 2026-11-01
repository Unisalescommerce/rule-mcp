/**
 * @module core/plans/shape
 *
 * Contract for AI-assisted development plans (ADR 154 amendment / WS3 of
 * docs/plans/_asd-ste100.md). Persona trio checklists stay finding-shaped
 * (ADR 59); this scanner applies to product development plans under docs/plans/.
 */

/**
 * Embeddable guide for generators and persona/operation prompts.
 * Prefer this over inventing a second wording.
 */
export const DEVELOPMENT_PLAN_SHAPE_GUIDE =
  "Development plans (docs/plans/_*.md): organize work as workstreams WS1..WSn (or WS-A when the level-0 index already uses letters). Split each workstream into tasks WS1-T1 / WSn-Tx.y (and nested WSi-Tj.k). Carry a ## Dependency graph with a parseable edge list (Depends on: / Feeds: / Shared files: or an edge table) AND a fenced text diagram. One workstream owns a file set; serialize CONFLICT edges. Keep AI execution linear.";

/** Workstream heading: ### WS1, ## WS-A, ### WS1 - title, etc. */
const WORKSTREAM_HEADING = /^#{2,3}\s*WS(?:\d+|[A-Z])\b/m;

/** Task id in a checkbox or bold label: WS1-T1, WS1-T1.1, WS-A-T2 */
const TASK_ID = /\bWS(?:\d+|[A-Z])-T\d+(?:\.\d+)?\b/;

/** A fenced block that can hold the diagram (any info string). */
const FENCED_BLOCK = /```[\w-]*\r?\n[\s\S]*?```/;

/**
 * Scan a development-plan markdown body for the WSn / dual-graph contract.
 *
 * @param {string} text
 * @returns {{ ok: boolean, findings: Array<{ id: string, detail: string }> }}
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

  return { ok: findings.length === 0, findings };
}
