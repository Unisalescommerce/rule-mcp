/** What each plan still wants done, so a resuming session proposes before it starts. */
import { readFileSync } from "node:fs";

import { planGraph } from "./_plan-graph-order.js";

/** How many continuation lines a wrapped step may carry before it is cut. */
const MAX_CONTINUATION = 6;

/** The run date a plan stamps on itself, or "" when it carries none. */
function dateOf(text) {
  return text.match(/\*\*Date\*\*: (\S+)/)?.[1] || "";
}

/** The nearest heading above line `index`, or "" when the plan opens with steps. */
function headingBefore(lines, index) {
  for (let at = index - 1; at >= 0; at -= 1) {
    const heading = lines[at].match(/^#{2,}\s+(.+?)\s*$/);

    if (heading) {
      return heading[1];
    }
  }

  return "";
}

/** True for a line that opens a new list item or heading, so the step ended. */
const startsBlock = (line) => /^\s*(?:[-*+]\s|\d{1,3}\.\s|#)/.test(line);

/** The first unchecked step and the workstream heading that owns it. */
function firstOpenStep(text) {
  const lines = text.split("\n");
  const index = lines.findIndex((line) => /^\s*-\s*\[ \]\s+\S/.test(line));

  if (index === -1) {
    return null;
  }

  const step = [lines[index].replace(/^\s*-\s*\[ \]\s+/, "").trim()];

  // A step wraps at the column, so its continuation lines carry the rest of the
  // sentence. Cutting at the wrap hands the next session half a step, which is
  // worse than handing it nothing.
  for (let at = index + 1; at < lines.length && step.length <= MAX_CONTINUATION; at += 1) {
    const line = lines[at];

    if (line.trim() === "" || startsBlock(line)) {
      break;
    }

    step.push(line.trim());
  }

  return { workstream: headingBefore(lines, index), step: step.join(" ") };
}

/** How many unchecked steps a plan still carries. */
const openCount = (text) => (text.match(/^\s*-\s*\[ \]\s+\S/gm) ?? []).length;

/**
The open plans the cascade allows to start, newest date first.

A plan is proposed only when every HARD edge is met: its prerequisite carries
no open step, or a closeout ADR retired it. A plan that waits, a superseded
plan and a plan with nothing open propose nothing. The newest date wins
because the plan worked most recently is the likeliest one a session resumes;
the name breaks a tie.

@param {string} projectDir
@returns {Array<{ name: string, path: string, date: string, workstream: string, step: string, open: number }>}
*/
export function nextPlanSteps(projectDir) {
  let graph;

  try {
    graph = planGraph(projectDir);
  } catch {
    return [];
  }

  const plans = [];

  for (const plan of graph.ready) {
    let text;

    try {
      text = readFileSync(plan.file, "utf8");
    } catch {
      continue;
    }

    const next = firstOpenStep(text);

    if (next !== null) {
      plans.push({ name: plan.id, path: plan.path, date: dateOf(text), open: openCount(text), level: plan.level, ...next });
    }
  }

  // Prerequisites first: a plan whose dependencies are met but sit deeper in the
  // graph is offered after the shallower ones, so the cascade is linear in the
  // report even when many leaves are ready at once.
  return plans.sort((a, b) => a.level - b.level || b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
}
