/**
 * @module cli/setup/opentui/screen-paint
 *
 * The two primitives the screen paints with: a tone's color, and the progress
 * bar the rail shows.
 *
 * Split from `_screen.js` because they are pure formatting - no renderer, no
 * state - and the file that owns the renderer is the largest one in the wizard.
 */

import { COLORS, GLYPHS } from "../_theme.js";

const TONE = {
  accent: COLORS.accent,
  accentSoft: COLORS.accentSoft,
  info: COLORS.info,
  ok: COLORS.ok,
  warn: COLORS.warn,
  fail: COLORS.fail,
  muted: COLORS.muted,
};

export const colorOf = (tone) => TONE[tone];

/** The bar `done/total` at a fixed width. */
export function barText(done, total, width = 18) {
  const filled = total === 0 ? 0 : Math.round((done / total) * width);

  return `${GLYPHS.barFull.repeat(filled)}${GLYPHS.barEmpty.repeat(Math.max(0, width - filled))} ${done}/${total}`;
}
