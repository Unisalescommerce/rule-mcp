/**
@module core/guardrails/project/circular
 *
 * Which reported cycle is a cycle at run time.
 *
 * A JSDoc type reference names a module to describe the type of an argument,
 * and the graph reads that name as an import: a file that only documents its
 * argument is reported as a file that depends on it, and two of those close a
 * cycle nobody has. An edge counts here only when the target is imported
 * outside a comment.
 */

import { readFileSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";

import { stripComments } from "./_source-comments.js";

/**
 * Whether `from` imports `to` outside a comment.
 *
 * @param {string} from - Absolute path of the importing file
 * @param {string} to - Absolute path of the target
 * @returns {boolean}
 */
export function importsAtRuntime(from, to) {
  let source;

  try {
    source = stripComments(readFileSync(from, "utf8"));
  } catch {
    return false;
  }

  const specifier = withoutExtension(relative(dirname(from), to));

  // Either quote, with or without the extension: two files that import each
  // other do not always spell the specifier the same way.
  const quoted = [`"./${specifier}.js"`, `'./${specifier}.js'`, `"./${specifier}"`, `'./${specifier}'`];

  return quoted.some((literal) => source.includes(literal));
}

/** A path without its extension, so `a/x.js` and `a/x` compare. */
const withoutExtension = (path) => path.replace(/\.m?js$/, "");

/**
 * The reported cycles whose every edge is a run-time import.
 *
 * @param {{ cycles?: string[][] }} value - the tool's answer
 * @param {string} projectDir
 * @returns {string[][]}
 */
export function realCycles(value, projectDir) {
  const cycles = Array.isArray(value?.cycles) ? value.cycles : [];

  return cycles.filter((cycle) => {
    if (!Array.isArray(cycle) || cycle.length < 2) {
      return false;
    }

    for (const [index, file] of cycle.entries()) {
      const next = normalize(join(projectDir, cycle[(index + 1) % cycle.length]));

      if (!importsAtRuntime(join(projectDir, file), next)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * The failure a cycle report describes, or null when every reported cycle is a
 * type reference rather than an import.
 *
 * @param {{ cycles?: string[][] }} value
 * @param {string} projectDir
 * @returns {null | { failCount: number, detail: string[], suggestion: string }}
 */
export function circularFailure(value, projectDir) {
  const relevant = realCycles(value, projectDir).filter((cycle) => cycle.some((file) => String(file).startsWith("src/")));

  if (relevant.length === 0) {
    return null;
  }

  return {
    failCount: relevant.length,
    detail: [`${relevant.length} circular file dependency cycle(s) touching src/`, `first: ${relevant[0].join(" -> ")}`],
    suggestion: "Break the cycle; `tokensave_imports` names the import statements to cut.",
  };
}
