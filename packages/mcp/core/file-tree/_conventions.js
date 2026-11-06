import { extname } from "node:path";

import { isGitIgnored } from "../ignore/_gitignore.js";

/** Directories to ignore during scan. */
export const IGNORE_DIRS = new Set(["node_modules", ".git", ".tokensave", "dist", "build", ".next", ".nuxt", ".output", "coverage", ".vscode", ".idea", ".agents"]);

/** File names that count as a folder's barrel. */
export const BARREL_FILE_NAMES = new Set(["index.js", "index.ts", "index.jsx", "index.tsx"]);

/** Extensions a component file can carry. */
export const COMPONENT_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte", ".css"]);

/**
 * @typedef {"missing-barrel"|"wrong-prefix"|"missing-css"|"bare-file"|"wrong-folder-name"|"orphan-css"|"empty-barrel"|"stale-file"|"extra-file"} IssueType
 */

/**
 * @typedef {Object} FileTreeIssue
 * @property {IssueType} type - Type of issue detected
 * @property {string} path - Absolute path to the problematic file/directory
 * @property {string} message - Human-readable description
 * @property {boolean} fixable - Whether auto-fix is available
 * @property {string} [suggestion] - How to fix it
 * @property {string} [fixAction] - Description of what auto-fix would do
 * @property {number} [line] - Line number if applicable
 */

/**
 * Check if a path should be ignored based on its name.
 */
export function isIgnored(name) {
  return IGNORE_DIRS.has(name) || name.startsWith(".");
}

/**
 * Whether a walk should skip this directory entry.
 * Combines the hardcoded ignore list with `.gitignore` when a project root and
 * relative path are provided (WS4 must-honor for file-tree).
 *
 * @param {string} name - Basename of the entry
 * @param {{ projectDir?: string, relativePath?: string }} [context]
 * @returns {boolean}
 */
export function shouldSkipWalk(name, { projectDir, relativePath } = {}) {
  if (isIgnored(name)) {
    return true;
  }

  if (projectDir && relativePath && isGitIgnored(projectDir, relativePath)) {
    return true;
  }

  return false;
}

/**
 * Check if a file is a barrel file (index.js/ts/jsx/tsx).
 */
export function isBarrelFile(name) {
  return BARREL_FILE_NAMES.has(name);
}

/**
 * Check if a file follows the underscore + PascalCase convention.
 */
export function isPrefixedComponent(name) {
  return /^_[A-Z][a-zA-Z0-9]*\.[a-z]+$/.test(name);
}

/**
 * Check if a file looks like a component but lacks the underscore prefix.
 * Matches: PascalCase.ext, kebab-case.ext, camelCase.ext
 */
export function isBareComponent(name) {
  if (isBarrelFile(name) || name.startsWith("_")) {
    return false;
  }

  const extension = extname(name);

  // Exclude utility files that belong at the folder root: kebab-case utils.
  if (!COMPONENT_EXTENSIONS.has(extension) || /^[a-z][a-z0-9-]*\.[a-z]+$/.test(name)) {
    return false;
  }
  // Match files that look like components: PascalCase, camelCase starting with uppercase
  return /^[A-Z][a-zA-Z0-9]*\./.test(name);
}
