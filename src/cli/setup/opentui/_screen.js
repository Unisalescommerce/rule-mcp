/**
 * @module cli/setup/opentui/screen
 *
 * The OpenTUI adapter: one renderer for the whole wizard, and the four things
 * a step needs from it - a rail that moves, a list to answer with, a block of
 * lines to confirm, and a live row per task while the plan runs.
 *
 * One renderer for the whole run is the point. Every screen mounts into the
 * same body box, so the rail, the title bar and the key bar never flicker and
 * the user's position in the wizard is always on screen. The native core is
 * imported inside `openScreen`, not at module load: the test suite and the
 * flag path must never pay for it.
 *
 * Text is `selectable: true` everywhere, which is the reason this renderer was
 * chosen: the user can drag over the review, copy it, and paste it into a bug
 * report.
 */

import { pkg } from "../../paths/index.js";
import { COLORS, GLYPHS } from "../_theme.js";
import { barText, colorOf } from "./_screen-paint.js";
import { BACK, CANCEL } from "./_answers.js";
import { copyToClipboard, toast } from "./_clipboard.js";
import { detailLines, enabledIds, initialCursor, markOf, moveCursor, selectableIndexes, windowFor } from "./_list.js";

/**
 * The renderer options the wizard needs.
 *
 * `alternate-screen` is what makes this a viewport application instead of
 * scrollback: the frame owns the window while it runs, and the shell history
 * is exactly as the user left it afterwards. `exitOnCtrlC` is off because the
 * wizard owns Ctrl+C - quitting from a list must not skip the cleanup that
 * restores the cursor.
 *
 * @returns {object}
 */
export function rendererOptions() {
  return { screenMode: "alternate-screen", exitOnCtrlC: false, useMouse: true, targetFps: 30 };
}

/**
 * Open the wizard's renderer and return the port the flow drives.
 *
 * @param {{ title: string, subtitle?: string, steps?: string[] }} options
 * @returns {Promise<object>}
 */
export async function openScreen({ title, subtitle = "", steps = [] }) {
  const { BoxRenderable, TextRenderable, TextAttributes, createCliRenderer } = await import("@opentui/core");
  const renderer = await createCliRenderer(rendererOptions());

  const text = (content, options = {}) => new TextRenderable(renderer, { content, selectable: true, ...options });
  const bold = TextAttributes.BOLD;
  const empty = () => new BoxRenderable(renderer, { flexDirection: "column" });

  /** Remove every child of a box, freeing the native nodes with it. */
  const clear = (box) => {
    for (const child of box.getChildren()) {
      box.remove(child);
      child.destroyRecursively();
    }
  };

  /** Drop the running plan's frame, if one is still mounted. */
  const clearProgress = () => {
    if (!progressHost) {
      return;
    }

    body.remove(progressHost.host);
    progressHost.host.destroyRecursively();
    progressHost = null;
  };

  const header = new BoxRenderable(renderer, { flexDirection: "row", justifyContent: "space-between", borderStyle: "rounded", borderColor: COLORS.accent, paddingX: 1 });
  const rail = new BoxRenderable(renderer, { flexDirection: "row", paddingX: 2 });
  const body = new BoxRenderable(renderer, { flexDirection: "column", flexGrow: 1, paddingX: 2, paddingTop: 1, overflow: "hidden" });
  const footer = new BoxRenderable(renderer, { flexDirection: "row", borderStyle: "rounded", borderColor: COLORS.muted, paddingX: 1 });

  const headerLeft = new BoxRenderable(renderer, { flexDirection: "row" });

  headerLeft.add(text("rule-mcp", { fg: COLORS.accent, attributes: bold }));
  headerLeft.add(text(`  ${GLYPHS.dot}  ${title}`, { fg: COLORS.info }));

  if (subtitle) {
    headerLeft.add(text(`  ${subtitle}`, { fg: COLORS.muted }));
  }

  header.add(headerLeft);
  header.add(text(`v${pkg.version}`, { fg: COLORS.muted }));
  renderer.root.add(header);
  renderer.root.add(rail);
  renderer.root.add(body);
  renderer.root.add(footer);

  /** The handler the current screen installed, if any. */
  let pending = null;
  let activeStep = -1;
  let progressHost = null;

  const setHints = (hints) => {
    clear(footer);

    if (hints.length === 0) {
      return;
    }

    footer.add(text(hints[0][0], { fg: COLORS.accentSoft, attributes: bold }));
    footer.add(text(` ${hints[0][1]}`, { fg: COLORS.muted }));

    for (const [key, action] of hints.slice(1)) {
      footer.add(text(`  ${GLYPHS.dot}  `, { fg: COLORS.muted }));
      footer.add(text(key, { fg: COLORS.accentSoft, attributes: bold }));
      footer.add(text(` ${action}`, { fg: COLORS.muted }));
    }
  };

  const setStep = (index) => {
    activeStep = index;
    clear(rail);

    for (const [position, step] of steps.entries()) {
      if (position > 0) {
        rail.add(text("  ", { fg: COLORS.muted }));
      }

      const state = position === activeStep ? "active" : position < activeStep ? "done" : "ahead";
      const marker = state === "done" ? GLYPHS.ok : state === "active" ? GLYPHS.radioOn : GLYPHS.radioOff;
      const tone = state === "active" ? COLORS.info : state === "done" ? COLORS.ok : COLORS.muted;

      rail.add(text(`${marker} ${step}`, { fg: tone, ...(state === "active" ? { attributes: bold } : {}) }));
    }
  };

  /** Detach the current screen and resolve it with one answer. */
  const finish = (resolve, value, host) => {
    pending = null;
    body.remove(host);
    host.destroyRecursively();
    resolve(value);
  };

  /**
   * Show a list and resolve with the answer.
   *
   * The list fills the body below the title and help: a fixed height of ten
   * rows left the agent catalog looking half-empty on a tall terminal. The
   * detail panel is a third of the width with flexShrink off, so the label
   * cannot collapse to a one-character column when the list grows.
   *
   * @param {{ title: string, help?: string[], items: object[], mode?: "check"|"radio", initial?: string[], height?: number, note?: string }} spec
   * @returns {Promise<string|string[]|symbol>}
   */
  const ask = async ({ title: heading, help = [], items, mode = "check", initial = [], height, note = "" }) => {
    clearProgress();

    return new Promise((resolve) => {
      const indexes = selectableIndexes(items);
      const allowed = new Set(enabledIds(items));
      const selected = new Set(initial.filter((id) => allowed.has(id)));
      let cursor = initialCursor(items, indexes, initial, mode);

      // Header + rail + footer + title + help + note + padding around the list.
      const reserved = 9 + help.length + (note ? 1 : 0);
      const listHeight = Math.max(5, Math.min(height ?? Number.POSITIVE_INFINITY, renderer.terminalHeight - reserved));
      const detailWidth = Math.max(28, Math.min(44, Math.floor(renderer.terminalWidth / 3)));

      const host = new BoxRenderable(renderer, { flexDirection: "column", flexGrow: 1 });
      const listRow = new BoxRenderable(renderer, { flexDirection: "row", flexGrow: 1, paddingTop: 1, overflow: "hidden" });
      const list = new BoxRenderable(renderer, { flexDirection: "column", flexGrow: 1, flexShrink: 1, minWidth: 24, overflow: "hidden" });
      const detail = new BoxRenderable(renderer, {
        flexDirection: "column",
        width: detailWidth,
        flexShrink: 0,
        paddingLeft: 2,
        overflow: "hidden",
      });

      listRow.add(list);
      listRow.add(detail);

      host.add(text(heading, { fg: COLORS.accentSoft, attributes: bold }));

      for (const line of help) {
        host.add(text(line, { fg: COLORS.muted }));
      }

      host.add(listRow);

      if (note) {
        host.add(text(note, { fg: COLORS.muted }));
      }

      const paintRow = (item, index) => {
        if (item.section) {
          const row = new BoxRenderable(renderer, { flexDirection: "row", paddingTop: index === 0 ? 0 : 1 });

          row.add(text(item.label, { fg: COLORS.accentSoft, attributes: bold }));

          return row;
        }

        const active = index === cursor;
        const isSelected = mode === "radio" ? active : selected.has(item.id);
        const row = new BoxRenderable(renderer, { flexDirection: "row" });
        const labelTone = item.disabled ? COLORS.muted : active ? COLORS.info : null;

        row.add(text(`${active ? GLYPHS.pointer : " "} `, { fg: active ? COLORS.info : COLORS.muted }));
        row.add(text(`${GLYPHS[markOf(isSelected, mode)]} `, { fg: item.disabled ? COLORS.muted : isSelected ? COLORS.ok : COLORS.muted }));
        row.add(text(item.label, { ...(labelTone ? { fg: labelTone } : {}), ...(active ? { attributes: bold } : {}) }));

        if (item.note) {
          row.add(text(`  ${item.note}`, { fg: colorOf(item.noteTone) ?? COLORS.muted }));
        }

        return row;
      };

      const paint = () => {
        clear(list);

        const { start, end } = windowFor(items.length, cursor, listHeight);

        for (const [offset, item] of items.slice(start, end).entries()) {
          list.add(paintRow(item, start + offset));
        }

        const hidden = items.length - (end - start);

        if (hidden > 0) {
          list.add(text(`  ${GLYPHS.dot} ${hidden} more`, { fg: COLORS.muted }));
        }

        clear(detail);

        const current = items[cursor];

        detail.add(text(current?.label ?? "", { fg: COLORS.accentSoft, attributes: bold, wrapMode: "word" }));

        for (const line of detailLines(current?.detail)) {
          detail.add(text(line, { fg: COLORS.muted, wrapMode: "word" }));
        }
      };

      const toggle = (item) => {
        if (!item || item.section || !allowed.has(item.id)) {
          return;
        }

        if (mode === "radio") {
          selected.clear();
          selected.add(item.id);

          return;
        }

        if (selected.has(item.id)) {
          selected.delete(item.id);
        } else {
          selected.add(item.id);
        }
      };

      const done = (value) => {
        setHints([]);
        finish(resolve, value, host);
      };

      pending = (key) => {
        const name = key.name;

        if ((key.ctrl && name === "c") || name === "q") {
          done(CANCEL);

          return;
        }

        if (name === "escape" || name === "left") {
          done(BACK);

          return;
        }

        if (name === "up" || name === "k") {
          cursor = moveCursor(indexes, cursor, -1);
        } else if (name === "down" || name === "j") {
          cursor = moveCursor(indexes, cursor, 1);
        } else if (name === "space" || key.sequence === " ") {
          toggle(items[cursor]);
        } else if (name === "a" && mode === "check") {
          for (const index of indexes) {
            if (allowed.has(items[index].id)) {
              selected.add(items[index].id);
            }
          }
        } else if (name === "n" && mode === "check") {
          selected.clear();
        } else if (/^[1-9]$/u.test(name)) {
          // Number keys jump and toggle in one keystroke, as the shell picker did.
          const target = indexes[Number(name) - 1];

          if (target !== undefined) {
            cursor = target;
            toggle(items[target]);
          }
        } else if (name === "return") {
          done(mode === "radio" ? items[cursor]?.id : [...selected]);

          return;
        } else {
          return;
        }

        paint();
      };

      setHints(
        mode === "radio"
          ? [
              ["up/down", "move"],
              ["enter", "next"],
              ["esc", "back"],
              ["q", "quit"],
            ]
          : [
              ["up/down", "move"],
              ["space", "toggle"],
              ["a/n", "all/none"],
              ["enter", "next"],
              ["esc", "back"],
              ["q", "quit"],
            ],
      );

      body.add(host);
      paint();
    });
  };

  /**
   * Show a block of lines and wait for one of the offered actions.
   *
   * @param {{ title: string, lines?: Array<{ text: string, tone?: string, bold?: boolean }>, actions?: Array<{ key: string, label: string, value: string }>, copy?: string, blocked?: boolean }} spec
   * @returns {Promise<string|symbol>}
   */
  const confirm = async ({ title: heading, lines = [], actions = [{ key: "return", label: "close", value: "close" }], copy = "", blocked = false }) => {
    clearProgress();

    return new Promise((resolve) => {
      const host = empty();

      host.add(text(heading, { fg: blocked ? COLORS.fail : COLORS.accentSoft, attributes: bold }));

      for (const line of lines) {
        host.add(text(line.text, { fg: colorOf(line.tone), ...(line.bold ? { attributes: bold } : {}) }));
      }

      if (copy) {
        host.add(text("", {}));
        host.add(text(`${GLYPHS.arrow} Press c to copy this screen to the clipboard.`, { fg: COLORS.muted }));
      }

      const done = (value) => {
        setHints([]);
        finish(resolve, value, host);
      };

      pending = (key) => {
        const name = key.name;

        if ((key.ctrl && name === "c") || name === "q") {
          done(CANCEL);

          return;
        }

        if (name === "escape") {
          done(BACK);

          return;
        }

        if (name === "c" && copy) {
          void copyToClipboard(copy).then((ok) => toast(renderer, ok ? "Copied to the clipboard" : "No clipboard available", 1200));

          return;
        }

        const action = actions.find((entry) => entry.key === name);

        if (action) {
          done(action.value);
        }
      };

      setHints([...actions.map((action) => [action.key === "return" ? "enter" : action.key, action.label]), ["q", "quit"]]);
      body.add(host);
    });
  };

  /**
   * Replace the body with one row per task, updated as the plan runs.
   *
   * @param {{ title: string, rows?: Array<{ text: string, tone?: string, bold?: boolean }>, done?: number }} spec
   */
  const progress = ({ title: heading, rows = [], done = 0 }) => {
    if (!progressHost) {
      const host = empty();
      const bar = text("", { fg: COLORS.accent });
      const list = empty();

      list.paddingTop = 1;
      host.add(text(heading, { fg: COLORS.accentSoft, attributes: bold }));
      host.add(bar);
      host.add(list);
      body.add(host);
      progressHost = { host, bar, list };
    }

    const { bar, list } = progressHost;

    bar.content = barText(done, rows.length);
    clear(list);

    for (const row of rows) {
      list.add(text(row.text, { fg: colorOf(row.tone), ...(row.bold ? { attributes: bold } : {}) }));
    }
  };

  renderer.keyInput.on("keypress", (key) => {
    pending?.(key);
  });

  setStep(0);
  setHints([]);

  return {
    setStep,
    ask,
    confirm,
    progress,
    /** Tear the renderer down; the alternate screen is restored with it. */
    close: () => {
      renderer.destroy();
    },
  };
}
