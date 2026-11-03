/** Guardrail `adr-english`: title, slug and prose are English */

export const adrEnglish = {
  id: "adr-english",
  label: "The record is English",
  description: "The tool refuses a non-English write, so the rule explains a record that arrived another way.",
  check: (code, context) => {
    const { scanDocumentForForeign, scanPathForForeign } = context.helpers;
    // The tool runs both scanners over the prose fields, never over the header:
    // an author's email splits into "com" and a path scanner reads that as a
    // Portuguese word. Strip the metadata lines before scanning, or every
    // record with a real author fails.
    const prose = code.replaceAll(/^\s*-?\s*\*{0,2}(?:Author|Date|Status|Tags)\*{0,2}:.*$/gm, "");
    const hits = [...scanDocumentForForeign(prose), ...scanPathForForeign(prose.replaceAll(/[\\/]+/g, " "))];

    return {
      pass: hits.length === 0,
      failCount: hits.length,
      detail: hits.slice(0, 10),
      suggestion: "Write the title, the slug and the prose in English, American spelling.",
    };
  },
};
