/** Guardrail `adr-author-line`: a person or a team wrote the decision */

const AUTHOR = /^[^\S\n]*(?:-[^\S\n]*)?\*{0,2}Author\*{0,2}:([^\n]*)$/m;

// The serving tool cannot be asked why. A record whose author is the machine
// that wrote it has no one to revisit the decision.
const TOOL = /^(?:rule-mcp|rule_mcp|agent|assistant|claude|opencode)\b/i;

export const adrAuthorLine = {
  id: "adr-author-line",
  label: "The author is a person or a team",
  description: "A tool name as author leaves nobody to ask when the decision is wrong.",
  check: (code) => {
    const author = code.match(AUTHOR)?.[1].replaceAll("*", "").trim();

    if (author !== undefined && !TOOL.test(author)) {
      return { pass: true, failCount: 0, detail: [] };
    }

    return {
      pass: false,
      failCount: 1,
      detail: [author === undefined ? "no Author line" : `author: ${author}`],
      suggestion: "Name the person or team who decided, as Name <email>. The tool is never the author.",
    };
  },
};
