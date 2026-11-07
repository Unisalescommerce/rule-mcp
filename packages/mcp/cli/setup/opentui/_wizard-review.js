/** The Review step: what the plan will do, the dry-run switch, and the final run. */

import { CANCEL, BACK } from "./_answers.js";
import { installPlan } from "./_wizard-steps.js";
import { reviewLines, surfaceLabel } from "./_items.js";
import { selectionLabel } from "../_commands-items.js";

/**
 * Show the plan and take the run answer.
 *
 * @param {{ screen: object, answers: object, context: object, defaults: object }} options
 * @returns {Promise<unknown>}
 */
export async function askReview({ screen, answers, context, defaults }) {
  const plan = installPlan({ answers, context, force: Boolean(defaults.force) });

  for (;;) {
    const action = await screen.confirm({
      title: "Review",
      lines: [
        { text: `Profile: ${answers.profile} - ${answers.dimensions.join(", ") || "nothing"}`, tone: "muted" },
        { text: `Surface: ${surfaceLabel(answers.surface)} - commands ${selectionLabel(answers.selection)}`, tone: "muted" },
        { text: "" },
        ...reviewLines(plan, { dryRun: answers.dryRun }),
      ],
      actions: [
        { key: "d", label: "toggle dry run", value: "dry" },
        { key: "return", label: answers.dryRun ? "keep it a dry run" : "run it", value: "run" },
      ],
    });

    if (action === CANCEL || action === BACK) {
      return action;
    }

    if (action === "dry") {
      answers.dryRun = !answers.dryRun;
      continue;
    }

    answers.plan = plan;

    return;
  }
}
