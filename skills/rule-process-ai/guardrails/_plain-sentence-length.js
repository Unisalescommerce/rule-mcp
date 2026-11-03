/** Guardrail `fp-plain-sentence-length`: no prose sentence past 25 words */

// ASD-STE100 caps a descriptive sentence at 25 words and a procedural one at
// 20. This project targets STE100 at about 80 percent, so the rule reads 25 and
// applies it to documents, where prose lives; a comment is scanned by the same
// pass but its sentences are short by nature and the rule does not need them.
const DOCUMENT = /\.(?:md|mdx|txt)$/i;
const MAX_WORDS = 25;
const WORD = /[A-Za-z0-9][A-Za-z0-9'-]*/g;

// The prose of a document, with fenced blocks and headings left out: neither is
// a sentence a reader parses as one.
function sentences(text) {
  const lines = [];
  let isInFence = false;

  for (const line of text.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      isInFence = !isInFence;
      continue;
    }

    if (!isInFence && !/^\s*#/.test(line)) {
      lines.push(line);
    }
  }

  return lines
    .join(" ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

export const fpPlainSentenceLength = {
  id: "ai-plain-sentence-length",
  label: "No sentence past 25 words",
  description: "A descriptive sentence past 25 words is where a reader loses the thread; STE100 caps it there.",
  check: (code, context) => {
    if (!DOCUMENT.test(String(context.fileName ?? ""))) {
      return { pass: true, failCount: 0, detail: [] };
    }

    const long = sentences(code)
      .map((sentence) => ({ sentence, words: (sentence.match(WORD) ?? []).length }))
      .filter(({ words }) => words > MAX_WORDS);
    const detail = long.map(({ sentence, words }) => `${words} words: "${sentence.slice(0, 60)}..."`);

    return {
      pass: long.length === 0,
      failCount: long.length,
      detail,
      suggestion: "Split the sentence at its second idea. One sentence, one claim.",
    };
  },
};
