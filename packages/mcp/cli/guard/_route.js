/**
 * @module cli/guard/route - the skills a path-routed check sends one file to
 *
 * The extension picks one skill, as it always did, and every skill whose
 * `paths` globs match the file is added after it
 * (docs/adr/_pending/a-skill-names-its-paths-and-a-rule-its-severity.md).
 */

import { extname } from "node:path";

import { skillsForGlobs } from "../../core/guardrails/engine/_scope.js";
import { CHECKABLE, skillForPath } from "./_decide.js";

/**
 * @param {string} path - relative to the project root
 * @returns {string[]} the skills to check the file against, none when nothing applies
 */
export function skillsForPath(path) {
  const byExtension = CHECKABLE.has(extname(path)) ? [skillForPath(path)] : [];

  return [...new Set([...byExtension, ...skillsForGlobs(path)])];
}
