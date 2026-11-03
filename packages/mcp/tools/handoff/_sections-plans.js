/** The plan graph as a handoff section: the cascade, and what the graph cannot resolve. */
import { planGraph } from "../handon/_plan-graph-order.js";

/**
The plan analysis every handoff carries: how much work the cascade allows, how
much waits, and the edges that resolve to nothing. A handoff that omitted it
would let a session start work whose prerequisite is still open.

@param {string} projectDir
@param {{ heading?: string }} [shape]
@returns {string[]}
*/
export function planGraphLines(projectDir, { heading = "###" } = {}) {
  const analysis = planGraph(projectDir);
  const ready = analysis.ready.slice(0, 5).map((plan) => plan.id);
  const lines = [
    `${heading} Plan graph`,
    "",
    `- ready: ${analysis.ready.length}${ready.length > 0 ? ` (${ready.join(", ")}${analysis.ready.length > ready.length ? ", ..." : ""})` : ""}`,
    `- blocked: ${analysis.blocked.length}`,
    `- unknown edges: ${analysis.unknown.length}`,
    `- cycles: ${analysis.cycles.length}`,
    "",
  ];

  for (const cycle of analysis.cycles) {
    lines.push(`- **cycle**: ${cycle}`);
  }

  for (const edge of analysis.unknown) {
    lines.push(`- **unknown edge**: ${edge}`);
  }

  if (analysis.cycles.length > 0 || analysis.unknown.length > 0) {
    lines.push("");
  }

  return lines;
}
