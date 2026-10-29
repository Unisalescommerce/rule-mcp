/** @module core/fix/js-style - the deterministic JavaScript style passes */

import { apply as blankBeforeReturn } from "./_blank-before-return.js";
import { apply as blankBetweenMethods } from "./_blank-between-methods.js";
import { apply as splitOneLiners } from "./_split-one-liners.js";
import { apply as constTop } from "./_const-top.js";
import { apply as blankBlocks } from "./_blank-blocks.js";
import { checkCode } from "../engine/index.js";

/** The passes, in the order the detectors expect. */
export const JS_STYLE_PASSES = [blankBeforeReturn, blankBetweenMethods, splitOneLiners, constTop, blankBlocks];

/** How many rounds the chain may take to settle, so one pass cannot loop. */
const MAX_ROUNDS = 5;

/**
 * Run every pass in the order the detectors expect, until the text stops moving.
 *
 * One round is not enough: a pass can open a block on one round and the next
 * pass then separates what the first one wrote, so a single-round chain handed
 * the caller text the fixer would change again - which is why `rule-mcp fix`
 * reported some files forever.
 *
 * A chain that fed the guardrails a file those guardrails then reject is worse
 * than no chain: the fix says the file is done and the check says it fails. The
 * result is measured against `js-no-blank-lines-in-blocks` (and its neighbors in
 * the same rule set) before it is returned, and the original text wins a tie.
 *
 * @param {string} text
 * @param {{ fileName?: string }} [options]
 * @returns {{ text: string, changed: boolean }}
 */
export function applyJsStyle(text, { fileName = "input.js" } = {}) {
  let current = text;
  let changed = false;

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    let movedThisRound = false;

    for (const pass of JS_STYLE_PASSES) {
      const result = pass(current);

      current = result.text;
      movedThisRound = movedThisRound || result.changed;
    }

    changed = changed || movedThisRound;

    if (!movedThisRound) {
      break;
    }
  }

  if (changed && failCount(current, fileName) > failCount(text, fileName)) {
    return { text, changed: false };
  }

  return { text: current, changed };
}

/**
 * How many rules reject this text.
 *
 * @param {string} text
 * @param {string} fileName
 * @returns {number}
 */
function failCount(text, fileName) {
  return checkCode("rule-styleguide-javascript", text, { fileName }).failCount;
}
