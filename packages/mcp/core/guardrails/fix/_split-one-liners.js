/** @module scripts/fix/self-guardrails/split-one-liners - js-for-loop-braces, js-single-line-method, js-if-braces */

import { insideLiteral, literalRanges } from "./_literals.js";

/** The leading whitespace of the line a match starts on. */
const indentOf = (text) => text.match(/^[ \t]*/)?.[0] ?? "";

/**
 * The body as one statement: a body that already ends in `;` or `}` keeps it.
 *
 * The old pass appended a semicolon unconditionally, so `{ return 1; }` became
 * `{ return 1;; }` and the split could never settle.
 */
const statement = (body) => (/[;}]$/.test(body) ? body : `${body};`);

/** A block whose body moves to its own line, indented from the opener. */
const block = (head, body) => {
  const indent = indentOf(head);

  return `${head}{\n${indent}  ${statement(body)}\n${indent}}`;
};

export function apply(text) {
  let changed = false;
  // A body that looks like code inside quotes is text, not a one-liner: the
  // pass works on offsets, so it can skip what a string or comment holds.
  const skip = (offset) => insideLiteral(literalRanges(text), offset);

  // ── js-for-loop-braces / js-single-line-method: split one-liners ──
  // `[ \t]*` rather than `\s*` around the braces: a body that sits on its own
  // line is a multi-line block, not a one-liner, and rewriting it moved code
  // the detector never flagged.
  text = text.replace(/(for\s*\([^()]*(?:\([^()]*\)[^()]*)*\)\s*)\{[ \t]*([^{}\n]+?)[ \t]*\}/g, (match, head, body, offset) => {
    if (skip(offset)) {
      return match;
    }

    changed = true;

    return block(head, body);
  });
  text = text.replace(/((?:constructor|\w+)\s*\([^()]*(?:\([^()]*\)[^()]*)*\)\s*)\{[ \t]*([^{}\n]+?)[ \t]*\}/g, (match, head, body, offset) => {
    // never touch `if (...) {` / `for (...) {` / `while (...) {`, handled above only for for; skip if/keywords
    if (/^\s*(if|for|while|switch|catch)\s*/.test(head) || skip(offset)) {
      return match;
    }

    changed = true;

    return block(head, body);
  });

  // ── js-if-braces: braceless if/for single statements ──
  text = text.replace(/^(\s*)(if|for|while|switch)\s*\(([^\n]*)\)\s*([^{\n][^\n;]*);?\s*$/gm, (match, ind, keyword, condition, statementBody, offset) => {
    if (/^\s*\{/.test(statementBody) || skip(offset)) {
      return match;
    }

    changed = true;

    return `${ind}${keyword} (${condition}) {\n${ind}  ${statementBody};\n${ind}}`;
  });

  return { text, changed };
}
