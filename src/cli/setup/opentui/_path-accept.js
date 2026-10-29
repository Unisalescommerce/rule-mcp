/**
@module cli/setup/opentui/path-accept
 *
 * What Enter means in the path field: accept the text when it names a folder, and
 * otherwise refuse it with the reason and the rows that come close.
 *
 * The refusal is the point. A field that accepted any string would let the plan
 * write into a directory that does not exist, and the error would arrive at the
 * write, not at the keystroke.
 */

import { existsSync, statSync } from "node:fs";

import { expandPath, suggestPaths } from "../_path-complete.js";

/** @returns {boolean} whether this path names a folder */
export function defaultIsDirectory(path) {
  return existsSync(path) && statSync(path).isDirectory();
}

/**
 * Accept the typed text, or say why not.
 *
 * @param {{ text: string, cwd: string, isDirectory: Function, suggestions?: object[] }} input
 * @returns {{ accepted: true, value: string } | { accepted: false, message: string, open: boolean }}
 */
export function acceptPath({ text, cwd, isDirectory, suggestions }) {
  const target = expandPath(text, cwd);

  if (text.trim() !== "" && isDirectory(target)) {
    return { accepted: true, value: target };
  }

  const items = suggestions ?? suggestPaths(text, cwd)?.items ?? [];

  return {
    accepted: false,
    open: items.length > 0,
    message: items.length > 0 ? `Not a folder: ${target} - suggestions: ${items.map((item) => item.value).join(", ")}` : `Not a folder: ${target}`,
  };
}
