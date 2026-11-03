/**
 * @module test/fixtures/prose-corpus
 *
 * Labeled pairs for the prose rules that outgrew `guardrail-corpus.mjs`. That
 * file is at its ratchet line count and only may shrink, so a data file that
 * cannot grow is a file to split, not a rule to leave untested.
 *
 * The characters that are the point of a case are built from code points, so
 * this file stays ASCII: a bidi control pasted here would reorder the lines a
 * reviewer reads, and a decomposed accent would be rewritten by an editor.
 *
 * @see test/fixtures/guardrail-corpus.mjs
 * @see skills/rule-process-ai/references/fingerprint.md
 */

const JS = "rule-styleguide-javascript";
const RLO = String.fromCodePoint(0x20_2e);
const E_ACUTE = String.fromCodePoint(0x00_e9);
const E_DECOMPOSED = `e${String.fromCodePoint(0x03_01)}`;

/** @type {Array<{rule: string, skill: string, label: "good"|"bad", why: string, code: string}>} */
export const PROSE_CORPUS = [
  {
    rule: "ai-bidi-controls",
    skill: JS,
    label: "bad",
    why: "a right-to-left override is invisible and can make code read as a comment",
    code: `// The check is safe ${RLO}// harmless\nexport const ok = true;\n`,
  },
  {
    rule: "ai-bidi-controls",
    skill: JS,
    label: "good",
    why: "the same line without the override: what a reviewer sees is what runs",
    code: `// The check is safe // harmless\nexport const ok = true;\n`,
  },
  {
    rule: "ai-no-emoji",
    skill: JS,
    fileName: "notes.md",
    label: "bad",
    why: "an emoji in a document is prose, not interface copy",
    code: `# Notes\n\nShip it ${String.fromCodePoint(0x1_f3_89)}\n`,
  },
  {
    rule: "ai-no-emoji",
    skill: JS,
    fileName: "notes.md",
    label: "good",
    why: "the same sentence in plain words",
    code: `# Notes\n\nShip it.\n`,
  },
  {
    rule: "ai-nfc-text",
    skill: JS,
    label: "bad",
    why: "a decomposed accent is a different byte sequence in a diff and in a grep",
    code: `// The caf${E_DECOMPOSED} closes at six.\nexport const open = true;\n`,
  },
  {
    rule: "ai-nfc-text",
    skill: JS,
    label: "good",
    why: "the precomposed form is the normalized one",
    code: `// The caf${E_ACUTE} closes at six.\nexport const open = true;\n`,
  },
  {
    rule: "ai-repeated-opener",
    skill: JS,
    fileName: "notes.md",
    label: "bad",
    why: "three paragraphs open on the same word, which is a template a reader can see",
    code: `# Notes\n\nShip the change on Friday. Ship the tests first.\n\nShip the change after review. The build stays green.\n\nShip the change with a flag. The flag goes away later.\n\nThe team agrees on the order.\n`,
  },
  {
    rule: "ai-repeated-opener",
    skill: JS,
    fileName: "notes.md",
    label: "good",
    why: "each paragraph opens on its own word",
    code: `# Notes\n\nPlan the change. Write the tests first.\n\nReview the diff. The build has to stay green.\n\nShip behind a flag. Delete the flag next week.\n\nThe team agrees on the order.\n`,
  },
  {
    rule: "ai-plain-sentence-length",
    skill: JS,
    fileName: "notes.md",
    label: "bad",
    why: "one sentence carries five ideas, so a reader loses the thread before the full stop",
    code: `# Notes\n\nWe ship the change behind a flag, measure it for a week, delete the flag when the numbers hold, write the result down, and tell the team what changed.\n`,
  },
  {
    rule: "ai-plain-sentence-length",
    skill: JS,
    fileName: "notes.md",
    label: "good",
    why: "the same content in sentences a reader can parse one at a time",
    code: `# Notes\n\nWe ship the change behind a flag. Measure it for a week. Delete the flag when the numbers hold. Write the result down and tell the team what changed.\n`,
  },
  {
    rule: "ai-structural-tells",
    skill: JS,
    fileName: "notes.md",
    label: "bad",
    why: "the closing paragraph repeats the opening almost word for word",
    code: `We ship the change behind a flag, measure it for a week, and delete the flag.\n\nThe team reviews the numbers on Friday morning, then decides.\n\nWe ship the change behind a flag, measure it for a week, and delete the flag.\n`,
  },
  {
    rule: "ai-structural-tells",
    skill: JS,
    fileName: "notes.md",
    label: "good",
    why: "the closing carries the consequence instead of repeating the opening",
    code: `We ship the change behind a flag, measure it for a week, and delete the flag.\n\nThe team reviews the numbers on Friday morning, then decides.\n\nThe flag disappears by the next release, and nobody has to remember it.\n`,
  },
];
