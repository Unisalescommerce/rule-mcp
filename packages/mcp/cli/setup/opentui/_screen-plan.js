/**
@module cli/setup/opentui/screen-plan
 *
 * The frame the install plan draws while it runs: one row per task, a bar that
 * fills with the finished ones, and the same title the step had.
 *
 * The frame is mounted once and then updated in place, so a plan that runs twenty
 * tasks does not flash twenty screens.
 */

import { barText, colorOf } from "./_screen-paint.js";
import { COLORS } from "../_theme.js";

/**
 * Build the plan frame for one screen.
 *
 * @param {{ renderer: object, body: object, empty: Function, text: Function }} port
 * @returns {{ clearProgress: Function, progress: Function }}
 */
export function createPlanFrame({ renderer, body, empty, text }) {
  let mounted = null;

  /** Drop the frame, if one is still mounted. */
  const clearProgress = () => {
    if (!mounted) {
      return;
    }

    body.remove(mounted.host);
    mounted.host.destroyRecursively();
    mounted = null;
  };

  /**
   * Replace the body with one row per task, updated as the plan runs.
   *
   * @param {{ title: string, rows?: Array<{ text: string, tone?: string, bold?: boolean }>, done?: number }} spec
   */
  const progress = ({ title: heading, rows = [], done = 0 }) => {
    if (!mounted) {
      const host = empty();
      const bar = text("", { fg: COLORS.accent });
      const list = empty();

      list.paddingTop = 1;
      host.add(text(heading, { fg: COLORS.accentSoft, attributes: 1 }));
      host.add(bar);
      host.add(list);
      body.add(host);
      mounted = { host, bar, list };
    }

    const { bar, list } = mounted;

    bar.content = barText(done, rows.length);

    for (const child of list.getChildren()) {
      list.remove(child);
      child.destroyRecursively();
    }

    for (const row of rows) {
      list.add(text(row.text, { fg: colorOf(row.tone), ...(row.bold && { attributes: 1 }) }));
    }
  };

  return { clearProgress, progress };
}
