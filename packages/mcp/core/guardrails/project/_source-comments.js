/** The source with comments removed, string literals kept: what a static reader may count. */

/**
 * The source with comments removed, string literals kept.
 *
 * The literals matter: an import specifier is a string, and a `//` inside a URL
 * in one of them is not the start of a comment.
 *
 * @param {string} source
 * @returns {string}
 */
export function stripComments(source) {
  let out = "";
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") {
        index += 1;
      }

      continue;
    }

    if (char === "/" && next === "*") {
      index += 2;

      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1;
      }

      index = Math.min(index + 2, source.length);
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      const quote = char;
      const start = index;

      index += 1;

      while (index < source.length) {
        if (source[index] === "\\") {
          index += 2;
          continue;
        }

        if (source[index] === quote) {
          index += 1;
          break;
        }

        index += 1;
      }

      out += source.slice(start, index);
      continue;
    }

    out += char;
    index += 1;
  }

  return out;
}
