/**
 * @module test/fixtures/bidi-corpus
 *
 * The labeled pair for `ai-bidi-controls`. It lives beside
 * `guardrail-corpus.mjs` rather than inside it because that file is at its
 * ratchet line count and only may shrink; a data file that cannot grow is a
 * file to split, not a rule to leave untested.
 *
 * The override is built from its code point, so this file stays ASCII: a bidi
 * control pasted here would reorder the lines a reviewer reads.
 *
 * @see test/fixtures/guardrail-corpus.mjs
 * @see skills/rule-process-ai/references/fingerprint.md
 */

const JS = "rule-styleguide-javascript";

/** @type {Array<{rule: string, skill: string, label: "good"|"bad", why: string, code: string}>} */
export const BIDI_CORPUS = [
  {
    rule: "ai-bidi-controls",
    skill: JS,
    label: "bad",
    why: "a right-to-left override is invisible and can make code read as a comment",
    code: `// The check is safe ${String.fromCodePoint(0x20_2e)}// harmless\nexport const ok = true;\n`,
  },
  {
    rule: "ai-bidi-controls",
    skill: JS,
    label: "good",
    why: "the same line without the override: what a reviewer sees is what runs",
    code: `// The check is safe // harmless\nexport const ok = true;\n`,
  },
];
