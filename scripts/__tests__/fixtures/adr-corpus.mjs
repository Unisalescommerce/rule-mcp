/**
 * @module test/fixtures/adr-corpus
 *
 * Labeled pairs for the six `rule-process-adr` rules. They live beside
 * `guardrail-corpus.mjs` rather than inside it because that file is at its
 * ratchet line count and only may shrink.
 *
 * Each entry carries the context the rule reads: a file name for the naming
 * rule, the file list and the index rows for the derived-index rule. A pair
 * judges its own rule alone, so an entry may trip another one as well.
 *
 * @see test/fixtures/adr - the versioned trees, for the rules that need a
 *   directory instead of a snippet
 */

const ADR = "rule-process-adr";

const HEADER = "- **Date**: 2026-11-03\n- **Status**: accepted\n- **Author**: Ada Lovelace <ada@example.com>\n";

/** @type {Array<{rule: string, skill: string, label: "good"|"bad", why: string, code: string, fileName?: string, fileList?: string[], indexRows?: string[]}>} */
export const ADR_CORPUS = [
  {
    rule: "adr-file-naming",
    skill: ADR,
    fileName: "docs/adr/900-a-good-slug.md",
    label: "good",
    why: "three digits and a kebab-case English slug",
    code: `# 900: A good slug\n\n${HEADER}`,
  },
  {
    rule: "adr-file-naming",
    skill: ADR,
    fileName: "docs/adr/900-Bad_Slug.md",
    label: "bad",
    why: "capitals and an underscore are not the file shape the index links",
    code: `# 900: A bad slug\n\n${HEADER}`,
  },
  {
    rule: "adr-status-vocabulary",
    skill: ADR,
    label: "good",
    why: "one of the four values the tool writes",
    code: `# 900: A decided record\n\n- **Date**: 2026-11-03\n- **Status**: accepted\n- **Author**: Ada Lovelace <ada@example.com>\n`,
  },
  {
    rule: "adr-status-vocabulary",
    skill: ADR,
    label: "bad",
    why: "a free-form status is not readable by any later check",
    code: `# 900: A decided record\n\n- **Date**: 2026-11-03\n- **Status**: accepted (for now)\n- **Author**: Ada Lovelace <ada@example.com>\n`,
  },
  {
    rule: "adr-author-line",
    skill: ADR,
    label: "good",
    why: "a person wrote the decision, so there is someone to ask",
    code: `# 900: A decided record\n\n${HEADER}`,
  },
  {
    rule: "adr-author-line",
    skill: ADR,
    label: "bad",
    why: "the serving tool cannot be asked why the decision was made",
    code: `# 900: A decided record\n\n- **Date**: 2026-11-03\n- **Status**: accepted\n- **Author**: rule-mcp\n`,
  },
  {
    rule: "adr-ends-when",
    skill: ADR,
    label: "good",
    why: "the record names the observation that would make it wrong",
    code: `# 900: A decided record\n\n${HEADER}\n## What would end this\n\nA corpus where the field-based check cannot separate a right record from a wrong one.\n`,
  },
  {
    rule: "adr-ends-when",
    skill: ADR,
    label: "bad",
    why: "the generated placeholder says nothing about the decision",
    code: `# 900: A decided record\n\n${HEADER}\n## What would end this\n\nThe assumption this leans on, and the observation that would make it wrong.\n`,
  },
  {
    rule: "adr-index-derived",
    skill: ADR,
    fileList: ["900-a-decided-record.md"],
    indexRows: ["900-a-decided-record.md"],
    label: "good",
    why: "the record is on disk and in the index",
    code: `# 900: A decided record\n\n${HEADER}`,
  },
  {
    rule: "adr-index-derived",
    skill: ADR,
    fileList: ["900-a-decided-record.md"],
    indexRows: [],
    label: "bad",
    why: "a record on disk with no index row is a document nobody can find",
    code: `# 900: A decided record\n\n${HEADER}`,
  },
  {
    rule: "adr-english",
    skill: ADR,
    label: "good",
    why: "the title is English",
    code: `# 900: A decided record\n\n${HEADER}`,
  },
  {
    rule: "adr-english",
    skill: ADR,
    label: "bad",
    why: "the tool refuses a non-English title, so a file that has one arrived another way",
    code: `# 900: Usare PostgreSQL per i dati\n\n${HEADER}`,
  },
];
