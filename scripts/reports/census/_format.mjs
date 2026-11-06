/**
 * @module scripts/reports/census/_format
 *
 * Markdown primitives the census sections share.
 *
 * Column widths are not padded here. The generator hands its output to
 * prettier, which owns the final bytes of every census document, so padding a
 * cell twice would only make the two disagree.
 */

/**
 * A bare `<word>` is a tag to the renderer and disappears from the page, so it
 * goes in a code span. Text already in a code span stays as it is.
 *
 * @param {string} text
 * @returns {string}
 */
export const spanPlaceholders = (text) =>
  text
    .split(/(`[^`]*`)/u)
    .map((part, index) => (index % 2 === 1 ? part : part.replaceAll(/<[a-zA-Z][\w-]*>/gu, (placeholder) => `\`${placeholder}\``)))
    .join("");

/** A markdown table cell cannot carry a raw pipe, a newline or a bare placeholder. */
export const cell = (value) =>
  spanPlaceholders(String(value ?? ""))
    .replaceAll("|", String.raw`\|`)
    .replaceAll(/\s*\n\s*/g, " ")
    .trim();

/**
 * One markdown table.
 *
 * @param {string[]} columns
 * @param {Array<Array<string>>} rows
 * @returns {string[]}
 */
export const table = (columns, rows) => [
  `| ${columns.join(" | ")} |`,
  `| ${columns.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.map((value) => cell(value)).join(" | ")} |`),
];

/** First sentence of a description, so a table row stays one line. */
export const firstSentence = (text) => {
  const clean = cell(text);
  const stop = clean.search(/\.\s|\.$/);

  return stop === -1 ? clean : clean.slice(0, stop + 1);
};

/** The area a `rule-mcp-<area>-<topic>` skill belongs to. */
export const areaOf = (name) => {
  const parts = name.split("-");

  return parts.length > 1 ? parts[1] : name;
};

/** The MCP tool a catalog skill directory mints: `rule-frontend-react` -> `rule_tool_frontend_react`. */
export const toolOf = (name) => {
  if (name === "rule") {
    return "rule_tool";
  }
  // A plan or a document can still name a skill with the long prefix.
  const bare = name.replace(/^rule-mcp-/u, "rule-").slice("rule-".length);

  return `rule_tool_${bare.replaceAll("-", "_")}`;
};
