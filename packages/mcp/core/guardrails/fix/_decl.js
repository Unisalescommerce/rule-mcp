/** @module scripts/fix/self-guardrails/decl - what counts as a declaration line */

/**
 * A variable declaration opener.
 *
 * `function` and `class` are not here: `js-const-top` asks for a blank line
 * after a group of `const`/`let`/`var` statements, and reading a function
 * opener as one inserted a blank line inside every function whose first
 * statement was a return - the guardrail then flagged the blank line it had
 * just written.
 */
export const DECL = /^\s*(?:export\s+)?(?:const|let|var)\b/;
/** Lines that continue a multi-line declaration. */
export const CONTINUES = (line) =>
  line.trim() === "" || line.trim() === "}" || line.endsWith("}") || line.endsWith("{") || line.endsWith("(") || /\b(?:=>|return)\s*$/.test(line.trim());
