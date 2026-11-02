/** Guardrail `fp-no-emoji`: no emoji in prose documents */

/**
 * Emoji in documents, not in code. A CLI draws a check mark in a string on
 * purpose, so a source file is out of scope; a document is prose, and an emoji
 * there is a tell. `Emoji_Presentation` is the set that renders as a picture on
 * its own, which keeps symbols a document may legitimately use (the copyright
 * sign, a trademark) out of the rule; the variation selector catches a
 * text-default glyph forced to render as emoji.
 */
const EMOJI = /\p{Emoji_Presentation}|\uFE0F/gu;

/** A document is where prose lives; a source file is where interface copy does. */
const DOCUMENT = /\.(?:md|mdx|txt)$/i;

export const fpNoEmoji = {
  id: "ai-no-emoji",
  label: "No emoji in prose documents",
  description: "An emoji in a document is a tell and a compatibility risk; interface copy in code is out of scope.",
  check: (code, context) => {
    if (!DOCUMENT.test(String(context.fileName ?? ""))) {
      return { pass: true, failCount: 0, detail: [] };
    }

    const found = [...new Set(code.match(EMOJI) ?? [])];

    return {
      pass: found.length === 0,
      failCount: found.length,
      detail: found.map((character) => `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`),
      suggestion: "Write the word instead. A glyph that must stay belongs in a message table, not in a document.",
    };
  },
};
