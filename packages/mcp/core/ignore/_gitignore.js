/**
 * @module core/ignore/gitignore
 *
 * Honor `.gitignore` for project tree walks that must not invent findings from
 * ignored noise (WS4 of docs/plans/_asd-ste100.md). Uses `git check-ignore` so
 * pattern semantics match Git without adding an npm dependency.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** @type {Map<string, Map<string, boolean>>} */
const cacheByRoot = new Map();

/**
 * Whether `relativePath` (project-relative, forward slashes or OS separators) is
 * ignored by Git for `projectDir`. Returns false when Git is unavailable or the
 * path is not ignored.
 *
 * @param {string} projectDir
 * @param {string} relativePath
 * @returns {boolean}
 */
export function isGitIgnored(projectDir, relativePath) {
  if (!projectDir || !relativePath) {
    return false;
  }

  const normalized = relativePath
    .split(/[\\/]+/)
    .filter(Boolean)
    .join("/");

  if (!normalized) {
    return false;
  }

  if (!existsSync(join(projectDir, ".git")) && !existsSync(join(projectDir, ".gitignore"))) {
    return false;
  }

  let rootCache = cacheByRoot.get(projectDir);

  if (!rootCache) {
    rootCache = new Map();
    cacheByRoot.set(projectDir, rootCache);
  }

  if (rootCache.has(normalized)) {
    return rootCache.get(normalized);
  }

  const result = spawnSync("git", ["-C", projectDir, "check-ignore", "-q", "--", normalized], {
    encoding: "utf8",
  });

  // 0 = ignored, 1 = not ignored, other = treat as not ignored
  const ignored = result.status === 0;

  rootCache.set(normalized, ignored);

  return ignored;
}

/**
 * Clear the check-ignore cache (tests).
 *
 * @returns {void}
 */
export function clearGitignoreCache() {
  cacheByRoot.clear();
}
