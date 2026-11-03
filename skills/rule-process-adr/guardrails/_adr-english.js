/** Guardrail `adr-english`: title, slug and prose are English */

export const adrEnglish = {
  id: "adr-english",
  label: "The record is English",
  description: "The tool refuses a non-English write, so the rule explains a record that arrived another way.",
  check: (code, context) => {
    const { scanDocumentForForeign, scanPathForForeign } = context.helpers;
    // The title becomes the file name, so it is read by the path scanner word by
    // word; the body is read by the document scanner, which sees function words
    // and accents. Running the path scanner over the body flags ordinary English
    // words that collide with a loanword ("MIT", "die") and cries wolf.
    const title = code.match(/^#\s+(.+)$/m)?.[1] ?? "";
    const hits = [...scanPathForForeign(title), ...scanDocumentForForeign(code)];

    return {
      pass: hits.length === 0,
      failCount: hits.length,
      detail: hits.slice(0, 10),
      suggestion: "Write the title, the slug and the prose in English, American spelling.",
    };
  },
};
