/** Guardrail `adr-index-derived`: every record is in the index and every row resolves */

export const adrIndexDerived = {
  id: "adr-index-derived",
  label: "The index lists every record and nothing else",
  description: "The index is derived from the directory, so a drift means somebody edited it by hand.",
  check: (code, context) => {
    const files = context.fileList;
    const rows = context.indexRows;

    // Without a listing and an index there is nothing to compare, and a rule
    // that guesses would fail every snippet a caller checks on its own.
    if (!Array.isArray(files) || !Array.isArray(rows)) {
      return { pass: true, failCount: 0, detail: [] };
    }

    const records = files.filter((name) => /^\d{3}-.+\.md$/.test(name));
    const missing = records.filter((name) => !rows.includes(name));
    const dangling = rows.filter((name) => !records.includes(name) && !files.includes(name));
    const detail = [...missing.map((name) => `not in the index: ${name}`), ...dangling.map((name) => `index row with no file: ${name}`)];

    return {
      pass: detail.length === 0,
      failCount: detail.length,
      detail,
      suggestion: "Regenerate ADR.md from the directory; a hand edit is what the next write throws away.",
    };
  },
};
