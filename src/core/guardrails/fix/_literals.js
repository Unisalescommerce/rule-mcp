/**
@module core/guardrails/fix/literals
 *
 * The ranges of a source file that are text rather than code: string literals,
 * template literals and comments.
 *
 * The fixers are regex passes, so without this a body that happens to look like
 * code inside a string was rewritten: `const source = ['function f() {', '  return 1;', '}']`
 * was split as if the quotes were braces, and the file came out broken.
 */

/**
 * Ranges that are not code, as `[start, end)` offsets.
 *
 * A single- or double-quoted literal that runs past a newline is not treated as
 * one: an apostrophe in code and a quote inside a regex both open something that
 * never closes, and swallowing the rest of the file would stop the fixer from
 * touching real code.
 *
 * @param {string} text
 * @returns {Array<[number, number]>}
 */
export function literalRanges(text) {
  const ranges = [];
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (char === "/" && text[index + 1] === "/") {
      const start = index;

      while (index < text.length && text[index] !== "\n") {
        index += 1;
      }

      ranges.push([start, index]);
      continue;
    }

    if (char === "/" && text[index + 1] === "*") {
      const start = index;

      index += 2;

      while (index < text.length && !(text[index] === "*" && text[index + 1] === "/")) {
        index += 1;
      }

      index = Math.min(index + 2, text.length);
      ranges.push([start, index]);
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      const start = index;
      const quote = char;
      const spansLines = quote === "`";

      index += 1;

      while (index < text.length) {
        if (text[index] === "\\") {
          index += 2;
          continue;
        }

        if (text[index] === quote) {
          index += 1;
          break;
        }

        if (!spansLines && text[index] === "\n") {
          break;
        }

        index += 1;
      }

      // An unclosed single-line literal is code, not text: leave it alone.
      if (text[index - 1] === quote) {
        ranges.push([start, index]);
      }

      continue;
    }

    index += 1;
  }

  return ranges;
}

/**
 * Whether an offset falls inside one of the ranges.
 *
 * @param {Array<[number, number]>} ranges
 * @param {number} offset
 * @returns {boolean}
 */
export const insideLiteral = (ranges, offset) => ranges.some(([start, end]) => offset >= start && offset < end);
