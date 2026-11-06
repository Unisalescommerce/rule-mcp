/**
@module cli/setup/opentui/screen-path-field
 *
 * The path field as the screen mounts it: a line for the text, a row per folder
 * under it, the row count in the footer, and the refusal in place when Enter names
 * something that is not a folder.
 *
 * Kept out of `_screen.js` because the field is the one screen with a mode of its
 * own - Tab means two things, and `q` is a character - and the renderer that
 * mounts it should not grow a second key loop beside the list.
 */

import { pathKey, pathState } from "./_widget-path.js";
import { pathView } from "./_path-menu.js";
import { BACK, CANCEL } from "./_answers.js";
import { COLORS, GLYPHS } from "../_theme.js";

/**
 * Ask for a path, with the folder menu.
 *
 * @param {object} port - the screen's own pieces: renderer, body, text, clear, finish, setHints
 * @param {{ title: string, help?: string[], initial?: string, cwd?: string }} spec
 * @returns {Promise<string|symbol>}
 */
export function askPathField({ renderer, body, empty, text, BoxRenderable, clear, finish, setHints, clearProgress, press, spec }) {
  const { title: heading, help = [], initial = "", cwd } = spec;

  clearProgress();

  return new Promise((resolve) => {
    let state = pathState({ cwd, text: initial });
    const host = empty();
    const field = text("", { fg: COLORS.accentSoft });
    const menu = new BoxRenderable(renderer, { flexDirection: "column", paddingTop: 1, overflow: "hidden" });
    const footer = text("", { fg: COLORS.muted });
    const note = text("", { fg: COLORS.fail });

    host.add(text(heading, { fg: COLORS.accentSoft, attributes: 1 }));

    for (const line of help) {
      host.add(text(line, { fg: COLORS.muted, wrapMode: "word" }));
    }

    host.add(text("", {}));
    host.add(field);
    host.add(note);
    host.add(menu);
    host.add(footer);

    const done = (value) => {
      setHints([]);
      finish(resolve, value, host);
    };

    /** Redraw the field, the refusal and the visible rows. */
    const paint = () => {
      const view = pathView(state);

      field.content = `> ${state.text}`;
      note.content = state.message;
      clear(menu);

      for (const [offset, item] of view.items.slice(view.window.start, view.window.end).entries()) {
        const current = view.window.start + offset === view.cursor;

        menu.add(text(`${current ? GLYPHS.arrow : " "} ${item.name}`, { fg: current ? COLORS.accentSoft : COLORS.muted, ...(current && { attributes: 1 }) }));
      }

      footer.content = state.open ? view.footer : "";
    };

    /** Feed one key to the field, and finish when the field says it is done. */
    const onKey = (key) => {
      state = pathKey(state, key);

      switch (state.done?.type) {
        case "accept": {
          done(state.done.value);
          break;
        }
        case "cancel": {
          done(CANCEL);
          break;
        }
        case "back": {
          done(BACK);
          break;
        }
        default: {
          paint();
        }
      }
    };

    setHints([
      ["tab", "folders"],
      ["enter", "accept"],
      ["esc", "back"],
    ]);
    body.add(host);
    paint();

    // The screen owns the single key loop; the field takes its turn in it.
    press(onKey);
  });
}
