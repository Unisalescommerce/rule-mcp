/**
@module cli/setup/opentui/path-menu
 *
 * The rows under the path field: which folders the text implies, where the cursor
 * sits among them, and which of them the window shows.
 *
 * `suggestPaths` is the source, so the menu inherits its rules: the credentials
 * directories are never offered, the list only appears once the text names a
 * path, and only folders are listed.
 */

import { suggestPaths } from "../_path-complete.js";
import { windowFor } from "./_list.js";

/** How many rows the menu shows before it scrolls. */
const VISIBLE = 8;

/** @returns {number} the rows the menu shows at once */
export const visibleRows = () => VISIBLE;

/**
 * The suggestions the current text implies, and the window the cursor sits in.
 *
 * @param {{ text: string, cwd: string, cursor: number }} state
 * @returns {{ items: object[], cursor: number, total: number, window: object, footer: string, prefix: string }}
 */
export function pathView(state) {
  const suggestion = suggestPaths(state.text, state.cwd);
  const items = suggestion?.items ?? [];
  const cursor = Math.min(Math.max(0, state.cursor), Math.max(0, items.length - 1));
  const window = windowFor(items.length, cursor, VISIBLE);

  return {
    items,
    cursor,
    total: items.length,
    window,
    footer: items.length === 0 ? "0/0" : `${cursor + 1}/${items.length}`,
    prefix: suggestion?.prefix ?? "",
  };
}

/**
 * Take the row under the cursor as the new text.
 *
 * @param {object} state
 * @returns {object} the next state, closed
 */
export function applySelection(state) {
  const view = pathView(state);
  const selected = view.items[view.cursor];

  return selected ? { ...state, text: selected.value, open: false, cursor: 0, message: "" } : { ...state, open: false };
}
