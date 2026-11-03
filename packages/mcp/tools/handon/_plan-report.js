/** The report section: the cascade proposal and the graph warnings. */

const PROPOSAL_LIMIT = 12;

/**
The graph problems a resume report has to name: an edge that resolves to no
plan and no closeout ADR, and a cycle, which makes every plan in it blocked.

@param {{ unknown: string[], cycles: string[] }} analysis
@returns {string[]}
*/
export function graphWarnings(analysis) {
  const lines = [];

  if (analysis.cycles.length > 0) {
    lines.push(...analysis.cycles.map((cycle) => `cycle: ${cycle}`));
  }

  if (analysis.unknown.length > 0) {
    lines.push(...analysis.unknown.map((edge) => `unknown edge: ${edge}`));
  }

  return lines;
}

/**
The report section proposing the next workstream of each open plan.

The proposal is the tool's, the decision is the user's: a resume report that
started work on its own would be answering a question nobody asked. A graph
problem is named here rather than guessed at, because an unknown edge and a
cycle both block work the report would otherwise offer.

@param {Array<object>} plans @param {{ isMinimal?: boolean, warnings?: string[] }} [shape]
@returns {string[]}
*/
export function planLines(plans, { isMinimal, warnings = [] } = {}) {
  if ((!plans || plans.length === 0) && warnings.length === 0) {
    return [];
  }

  if (isMinimal) {
    return [];
  }

  const shown = (plans ?? []).slice(0, PROPOSAL_LIMIT);
  const more = (plans ?? []).length - shown.length;

  return [
    "## Next from the plans",
    "",
    "A proposal, not a decision: confirm the workstream with the user before starting it.",
    "",
    ...(warnings.length > 0 ? [...warnings.map((warning) => `- **graph**: ${warning}`), ""] : []),
    ...shown.map((plan) => {
      const when = plan.date ? ` (${plan.date})` : "";
      const workstream = plan.workstream ? `${plan.workstream}: ` : "";
      const openTail = plan.open > 1 ? ` (${plan.open - 1} more open step(s) in this plan)` : "";

      return `- **${plan.name}**${when} - ${workstream}${plan.step}${openTail}`;
    }),
    ...(more > 0 ? ["", `${more} more plan(s) are ready; the cascade report lists them by level.`] : []),
  ];
}
