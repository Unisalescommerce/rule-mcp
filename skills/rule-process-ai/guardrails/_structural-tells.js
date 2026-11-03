/** Guardrail `fp-structural-tells`: the closing paragraph does not restate the opening */

// A closing paragraph that says what the opening already said is padding, and
// it is the shape a model reaches for when it has nothing left. The check is a
// word overlap: both paragraphs have to be long enough for the overlap to mean
// something, and the shared set is taken against the shorter of the two so a
// long opening cannot hide a short echo.
const DOCUMENT = /\.(?:md|mdx|txt)$/i;
const MIN_WORDS = 8;
const SHARED_RATIO = 0.7;

// Function words carry no claim, so they do not count as a restatement.
const STOP = new Set(["this", "that", "with", "from", "have", "will", "they", "them", "their", "when", "what", "which", "into", "then", "than", "also"]);

// The words a paragraph says, lowercased, without the short ones that any two
// sentences share.
function wordsOf(paragraph) {
  return (paragraph.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((word) => !STOP.has(word));
}

// The paragraphs that carry prose, in order: fenced blocks, headings, lists
// and tables are structure, not an opening and a closing.
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

    blocks.push(block);
  }

  return blocks;
}

export const fpStructuralTells = {
  id: "ai-structural-tells",
  label: "The closing paragraph does not restate the opening",
  description: "An opening and a closing that share most of their words say one thing twice.",
  check: (code, context) => {
    if (!DOCUMENT.test(String(context.fileName ?? ""))) {
      return { pass: true, failCount: 0, detail: [] };
    }

    const blocks = paragraphs(code);

    if (blocks.length < 2) {
      return { pass: true, failCount: 0, detail: [] };
    }

    const opening = wordsOf(blocks[0]);
    const closing = wordsOf(blocks.at(-1));

    if (Math.min(opening.length, closing.length) < MIN_WORDS) {
      return { pass: true, failCount: 0, detail: [] };
    }

    const shared = closing.filter((word) => opening.includes(word));
    const ratio = new Set(shared).size / new Set(closing).size;

    return {
      pass: ratio < SHARED_RATIO,
      failCount: ratio < SHARED_RATIO ? 0 : 1,
      detail: ratio < SHARED_RATIO ? [] : [`the closing repeats ${Math.round(ratio * 100)}% of its words from the opening`],
      suggestion: "Delete the closing paragraph, or make it carry the consequence the opening did not.",
    };
  },
};
