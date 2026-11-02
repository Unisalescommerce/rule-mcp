/** Guardrail `fp-bidi-controls`: no invisible direction overrides */

/**
 * A bidi control is invisible, so it can reorder the characters around it. In
 * code review that lets a line read as a comment while it is not: the Trojan
 * Source attack. There is no style reason to keep one in prose either, so the
 * rule fires on any of them and the suggestion is the same: remove it.
 *
 * @param {string} character
 * @returns {string}
 */
function label(character) {
  return `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
}

export const fpBidiControls = {
  id: "ai-bidi-controls",
  label: "No invisible bidi control characters",
  description: "Directional overrides and isolates reorder what a reader sees, so they are removed and reported.",
  check: (code, { helpers: { findFingerprints } }) => {
    const { bidi } = findFingerprints(code);
    const found = [...new Set(bidi.map(label))];

    return {
      pass: bidi.length === 0,
      failCount: bidi.length,
      detail: found,
      suggestion: "Delete the directional override or isolate. A right-to-left document uses markup, not invisible characters.",
    };
  },
};
