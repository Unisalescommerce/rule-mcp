/**
@module core/guardrails/project/dead-code
 *
 * Which reported symbol is actually dead.
 *
 * The graph counts edges it can see: a function called from a table, a handler
 * imported by path at run time, or an export a test is the only reader of has
 * none. Those are alive, and a guardrail that calls them dead is a guardrail
 * everybody learns to ignore. What is left is what the graph can decide: a
 * symbol nobody exports, nobody calls in its own file, and no test owns.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Files a test owns: their helpers are entry points, not dead code. */
const TEST_PATH = /(?:^|\/)(?:__tests__|tests)\/|\.(?:test|fixture|stub)\.[cm]?js$/;

/**
 * Whether the file exports this name, by declaration or by an export list.
 *
 * @param {string} source
 * @param {string} name
 * @returns {boolean}
 */
const isExported = (source, name) =>
  new RegExp(String.raw`export\s+(?:async\s+)?(?:function|const|let|var|class)\s+${name}\b`).test(source) ||
  new RegExp(String.raw`export\s*\{[^}]*\b${name}\b[^}]*\}`).test(source);

/**
 * Whether a symbol is dead by the only rule the graph can answer.
 *
 * @param {{ file: string, name: string }} symbol
 * @param {string} projectDir
 * @returns {boolean}
 */
export function isTrulyDead(symbol, projectDir) {
  if (!symbol?.file || !symbol?.name || TEST_PATH.test(symbol.file)) {
    return false;
  }

  let source;

  try {
    source = readFileSync(join(projectDir, symbol.file), "utf8");
  } catch {
    // A file the graph knows and the disk does not is a stale index, not a
    // dead symbol: report nothing rather than a fact nobody can act on.
    return false;
  }

  if (isExported(source, symbol.name)) {
    return false;
  }

  const occurrences = [...source.matchAll(new RegExp(String.raw`\b${symbol.name}\b`, "g"))].length;

  return occurrences <= 1;
}

/**
 * The symbols the guardrail should count, from one tool answer.
 *
 * @param {{ symbols?: Array<{ file: string, name: string }> }} value
 * @param {string} projectDir
 * @returns {Array<{ file: string, name: string }>}
 */
export function deadSymbols(value, projectDir) {
  return (Array.isArray(value?.symbols) ? value.symbols : []).filter((symbol) => isTrulyDead(symbol, projectDir));
}

/**
 * The failure a dead-code report describes, or null when nothing it named is
 * dead by the rule above.
 *
 * @param {{ symbols?: Array<{ file: string, name: string }> }} value
 * @param {string} projectDir
 * @returns {null | { failCount: number, detail: string[], suggestion: string }}
 */
export function deadCodeFailure(value, projectDir) {
  const dead = deadSymbols(value, projectDir);

  if (dead.length === 0) {
    return null;
  }

  return {
    failCount: dead.length,
    detail: dead.slice(0, 10).map((symbol) => `${symbol.file}: ${symbol.name}`),
    suggestion: "Remove the symbol or call it; an exported or test-owned symbol is not counted here.",
  };
}
