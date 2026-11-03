/** @module core/review/docs/render */

import { STE100_WRITING_LINE } from "../../directive/_ste100.js";
import { REVIEW_COLUMNS, table } from "./_table.js";

/** The header every document of the trio opens with; a scoped run names its scope. */
function header(title, role, version, date, scope) {
  return [`# ${title}`, "", `- **Role**: ${role} v${version}`, `- **Date**: ${date}`, ...(scope ? [`- **Scope**: ${scope}`] : []), ""];
}

/** Render the audit skeleton: header plus the empty evidence table. */
export function renderAudit(role, version, date, scope) {
  return [
    ...header(`${role} audit`, role, version, date, scope),
    STE100_WRITING_LINE,
    "",
    "Evidence only: the commands this run executed with their measured values, the files it read,",
    "the sources it consulted. No opinions - those belong in the review.",
    "",
    "## Evidence",
    "",
    ...table(["What was measured", "How", "Result"], []),
    "",
  ].join("\n");
}

/** Render the review: header, provenance note and the findings table. */
export function renderReview(role, version, date, findings, scope) {
  const rows = findings.map((finding) => [finding.id, finding.severity, finding.status, finding.evidence, finding.summary]);

  return [
    ...header(`${role} review`, role, version, date, scope),
    STE100_WRITING_LINE,
    "",
    `Findings distilled from [the audit](../audits/${role}.md). A finding this run no longer reports is`,
    "flipped to resolved and kept one run for visibility, then removed.",
    "",
    ...(findings.length > 0 ? table(REVIEW_COLUMNS, rows) : ["No findings: this run found nothing to report."]),
    "",
  ].join("\n");
}

/**
Render the plan: header, provenance note, one workstream per severity and a
dependency graph the workstreams follow in order.

A finding becomes a task `WSn-Tm`, and its `steps` become `WSn-Tm.k`
sub-checkboxes. A checklist rather than a table so an executed step can be
marked with `[x]` in place; the sync keeps the mark - step or sub-step -
while the finding stays open. Steps are as many as the findings demand:
nothing caps the list.

@param {string} role @param {number} version @param {string} date
@param {Array<object>} open - open findings, worst first; `steps` on a
  finding becomes its numbered sub-checkboxes
@param {Set<string>} [checked] - marks to keep: a finding id for its step,
  `id#M` for its M-th sub-step
@param {string} [scope] - the binding scope of a scoped run, for the header
*/
export function renderPlan(role, version, date, open, checked = new Set(), scope) {
  const box = (done) => `- [${done ? "x" : " "}]`;
  const groups = new Map();

  for (const finding of open) {
    const key = finding.severity || "unspecified";
    groups.set(key, [...(groups.get(key) ?? []), finding]);
  }

  const workstreams = [...groups];
  let step = 0;

  return [
    ...header(`${role} plan`, role, version, date, scope),
    STE100_WRITING_LINE,
    "",
    `Steps re-derived from the open findings in [the review](../reviews/${role}.md) on every run, worst`,
    "first, grouped into one workstream per severity. Mark an executed step or sub-step with `[x]` -",
    "the next sync keeps the mark while its finding stays open. This file is deleted by the run that",
    "finds nothing open.",
    "",
    "## Dependency graph",
    "",
    "```",
    workstreams.map(([severity], at) => `${at === 0 ? "" : "  ".repeat(at)}WS${at + 1} - ${severity}`).join("\n"),
    "```",
    "",
    "Depends on: -",
    "",
    "Feeds: -",
    "",
    "Shared files: -",
    "",
    ...workstreams.flatMap(([severity, findings], groupIndex) => [
      `### WS${groupIndex + 1} - ${severity}`,
      "",
      ...findings.flatMap((finding) => {
        step += 1;
        const task = `WS${groupIndex + 1}-T${findings.indexOf(finding) + 1}`;

        return [
          `${box(checked.has(finding.id))} **${task} - Step ${step} - ${finding.id} (${finding.severity})**: ${finding.summary}`,
          ...(finding.steps ?? []).map((sub, subIndex) => `  ${box(checked.has(`${finding.id}#${subIndex + 1}`))} **${task}.${subIndex + 1} - ${step}.${subIndex + 1}**: ${sub}`),
        ];
      }),
      "",
    ]),
  ].join("\n");
}
