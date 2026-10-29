/** @module core/fix/js-style - the deterministic JavaScript style passes */

import { apply as blankBeforeReturn } from "./_blank-before-return.js";
import { apply as blankBetweenMethods } from "./_blank-between-methods.js";
import { apply as splitOneLiners } from "./_split-one-liners.js";
import { apply as constTop } from "./_const-top.js";
import { apply as blankBlocks } from "./_blank-blocks.js";

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
 * @param {string} text
 * @returns {{ text: string, changed: boolean }}
 */
export function applyJsStyle(text) {
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

  return { text: current, changed };
}
