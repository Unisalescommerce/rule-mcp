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
];
