/**
@module cli/setup/opentui/widget-path
 *
 * The path field: a text line with a folder menu under it, as a reducer.
 *
 * Every decision the field makes is in here, and no renderer is: what Tab does,
 * where the cursor wraps, when Enter accepts, what a burst of backspaces means.
 * The screen only mounts the two boxes and forwards the keys, which is what makes
 * the field testable without a terminal.
 *
 * `suggestPaths` is the source of the menu, so the field inherits its rules: the
 * credentials directories are never offered, and the list only appears once the
 * text names a path.
 */

import { acceptPath, defaultIsDirectory } from "./_path-accept.js";
import { applySelection, pathView } from "./_path-menu.js";

/**
 * A field with nothing typed in it.
 *
 * @param {{ cwd?: string, text?: string, isDirectory?: (path: string) => boolean }} [options]
 * @returns {{ text: string, open: boolean, cursor: number, cwd: string, message: string, done: undefined, isDirectory: Function }}
 */
export function pathState({ cwd = process.cwd(), text = "", isDirectory = defaultIsDirectory } = {}) {
  return { text, open: false, cursor: 0, cwd, message: "", done: undefined, isDirectory };
}

/** Re-open the menu over the text as it now stands. */
const reopen = (state) => {
  const view = pathView(state);

  return { ...state, open: view.total > 0, cursor: 0, message: "" };
};

/**
 * What Enter does when no menu row is under the cursor.
 *
 * A refusal opens the menu over the rows that come close, so the next Tab has
 * something to apply instead of leaving the user to retype the path.
 */
const acceptText = (state) => {
  const result = acceptPath({ text: state.text, cwd: state.cwd, isDirectory: state.isDirectory, suggestions: pathView(state).items });

  return result.accepted ? { ...state, open: false, message: "", done: { type: "accept", value: result.value } } : { ...state, open: result.open, cursor: 0, message: result.message };
};

/**
 * Apply one keystroke.
 *
 * @param {object} state - from {@link pathState} or the previous call
 * @param {{ name?: string, sequence?: string, ctrl?: boolean }} key
 * @returns {object} the next state, with `done` set when the field is finished
 */
export function pathKey(state, key = {}) {
  const name = key.name;

  if (key.ctrl && name === "c") {
    return { ...state, done: { type: "cancel" } };
  }

  if (state.done) {
    return state;
  }

  if (name === "tab") {
    if (!state.open) {
      return reopen(state);
    }

    return applySelection(state);
  }

  if (name === "return") {
    return state.open ? applySelection(state) : acceptText(state);
  }

  if (name === "escape") {
    return state.open ? { ...state, open: false, message: "" } : { ...state, done: { type: "back" } };
  }

  if (state.open) {
    if (name === "up" || name === "k") {
      const { total } = pathView(state);

      return { ...state, cursor: (pathView(state).cursor - 1 + total) % total };
    }

    if (name === "down" || name === "j") {
      const { total } = pathView(state);

      return { ...state, cursor: (pathView(state).cursor + 1) % total };
    }
  }

  if (name === "backspace") {
    // A burst arrives as one chunk: `sequence` holds as many characters as the
    // user pressed, and each one deletes a character of its own.
    const burst = Math.max(1, key.sequence?.length ?? 1);
    const text = state.text.slice(0, Math.max(0, state.text.length - burst));

    return { ...state, text, message: state.open ? state.message : "" };
  }

  if (name === undefined && typeof key.sequence === "string") {
    const printable = [...key.sequence].filter((character) => character >= " ").join("");

    if (printable === "") {
      return state;
    }

    // Typing closes the menu: the rows it showed answered an earlier text.
    return { ...state, text: state.text + printable, open: false, cursor: 0, message: "" };
  }

  return state;
}
