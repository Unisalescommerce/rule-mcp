/** Guardrail `adr-file-naming`: NNN-kebab-slug.md with three digits */

const NAME = /^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const NOT_A_RECORD = /^(?:ADR|README)\.md$/;

export const adrFileNaming = {
  id: "adr-file-naming",
  label: "The record file is NNN-kebab-slug.md",
  description: "The index derives its link from the file name, so a capital or an underscore breaks the link.",
  check: (code, context) => {
    const name = String(context.fileName ?? "")
      .split("/")
      .pop();

    if (!name || !name.endsWith(".md") || NOT_A_RECORD.test(name)) {
      return { pass: true, failCount: 0, detail: [] };
    }

    return {
      pass: NAME.test(name),
      failCount: NAME.test(name) ? 0 : 1,
      detail: NAME.test(name) ? [] : [name],
      suggestion: "Rename to three digits, a hyphen and a kebab-case English slug: 123-the-decision.md.",
    };
  },
};
