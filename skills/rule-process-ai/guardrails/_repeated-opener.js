/** Guardrail `fp-repeated-opener`: no three paragraphs opening the same way */

/**
 * The tell is structural, not lexical: three paragraphs that start with the
 * same word read as a template, which is what generated prose looks like. A
 * heading, a list item and a table row open a block without being a paragraph,
 * so they are skipped, and a block of fewer than four words is too short for
 * its opening to be a pattern.
 */
const DOCUMENT = /\.(?:md|mdx|txt)$/i;
const MIN_WORDS = 4;
const REPEATS = 3;

/**
 * The paragraphs of a document, without the blocks that are not paragraphs.
 *
 * @param {string} text
 * @returns {string[]}
 */
function paragraphs(text) {
  const blocks = [];
  let isInFence = false;

  for (const block of text.split(/\n\s*\n/)) {
    if (block.trimStart().startsWith("```")) {
      isInFence = !isInFence;
      continue;
    }

    if (isInFence || /^\s*(?:#|\||[-*+]\s|\d+[.)]\s|>)/.test(block)) {
      continue;
    }

    const words = block.match(/[A-Za-z]+/g) ?? [];

    if (words.length >= MIN_WORDS) {
      blocks.push(words[0].toLowerCase());
    }
  }

  return blocks;
}

export const fpRepeatedOpener = {
  id: "ai-repeated-opener",
  label: "No three paragraphs opening the same way",
  description: "Three paragraphs that start with the same word read as a template.",
  check: (code, context) => {
    if (!DOCUMENT.test(String(context.fileName ?? ""))) {
      return { pass: true, failCount: 0, detail: [] };
    }

    const counts = new Map();

    for (const opener of paragraphs(code)) {
      counts.set(opener, (counts.get(opener) ?? 0) + 1);
    }

    const repeated = [...counts].filter(([, count]) => count >= REPEATS);
    const detail = repeated.map(([opener, count]) => `"${opener}" opens ${count} paragraphs`);

    return {
      pass: repeated.length === 0,
      failCount: repeated.length,
      detail,
      suggestion: "Vary the opening of a paragraph, or fold the three into one. A template a reader can see is the tell.",
    };
  },
};
