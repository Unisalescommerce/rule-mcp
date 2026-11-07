/**
 * @module cli/setup/screen-plain
 *
 * The wizard's port on a terminal that cannot host the renderer.
 *
 * OpenTUI's native core loads `node:ffi`, which is a builtin from Node 26.1, so
 * a Node 24 host cannot draw the alternate screen. It runs every tool and the
 * same plan; only the drawing changes. This adapter answers the same six
 * methods with plain prompts, so the questions, the defaults and the review are
 * the ones the full-screen wizard asks.
 *
 * The prompt functions are injected: the mapping from a step to a prompt is
 * what a test asserts, and no test needs a terminal.
 */

import { resolve } from "node:path";

import { confirm as clackConfirm, isCancel, multiselect, select, text } from "@clack/prompts";

import { BACK, CANCEL } from "./opentui/_answers.js";
import { pathState } from "./opentui/_widget-path.js";
import { GLYPHS } from "./_theme.js";

/** The value the extra row answers with, when the user steps back. */
const BACK_ROW = "__back";

const DEFAULT_PROMPTS = { select, multiselect, text, confirm: clackConfirm };

/** Print one line on the terminal the wizard owns. */
const say = (line) => process.stdout.write(`${line}\n`);

/**
 * A screen that draws with prompts instead of an alternate screen.
 *
 * @param {{ prompts?: object, out?: (line: string) => void, steps?: string[] }} [options]
 * @returns {{ setStep: Function, ask: Function, askPath: Function, confirm: Function, progress: Function, close: Function }}
 */
export function createPlainScreen({ prompts = DEFAULT_PROMPTS, out = say, steps = [] } = {}) {
  const printed = new Set();
  let step = 0;

  /** A canceled prompt is the wizard's own cancel, not a value. */
  const answered = (value) => (isCancel(value) ? CANCEL : value);

  /** The rows a prompt can offer: no section headers, no disabled rows. */
  const choices = (items) => items.filter((item) => !item.section && !item.disabled).map((item) => ({ value: item.id, label: item.label, ...(item.note && { hint: item.note }) }));

  const heading = (title, help, note = "") => {
    out(`\n${steps[step] ? `${steps[step]} - ` : ""}${title}`);

    for (const line of help) {
      out(`  ${line}`);
    }

    if (note) {
      out(`  ${note}`);
    }
  };

  const ask = async ({ title, help = [], items = [], mode = "radio", initial = [], note = "" }) => {
    heading(title, help, note);

    const offered = [...choices(items), { value: BACK_ROW, label: "<- Back", hint: "previous step" }];

    if (mode === "radio") {
      const picked = answered(await prompts.select({ message: "Choose one", options: offered, initialValue: initial[0] }));

      return picked === BACK_ROW ? BACK : picked;
    }

    const picked = answered(await prompts.multiselect({ message: "Choose any", options: offered, initialValues: initial, required: false }));

    return Array.isArray(picked) && picked.includes(BACK_ROW) ? BACK : picked;
  };

  const askPath = async ({ title, help = [], initial = "", cwd }) => {
    heading(title, help);

    const { isDirectory } = pathState({ cwd });

    return answered(
      await prompts.text({
        message: "Path",
        initialValue: initial,
        validate: (value) => (value && isDirectory(resolve(String(value))) ? undefined : "That is not a folder."),
      }),
    );
  };

  const confirm = async ({ title, lines = [], actions = [{ key: "return", label: "close", value: "close" }] }) => {
    out(`\n${title}`);

    for (const line of lines) {
      out(`  ${line.text}`);
    }

    if (actions.length === 1) {
      return answered(await prompts.confirm({ message: actions[0].label })) === true ? actions[0].value : CANCEL;
    }

    return answered(
      await prompts.select({
        message: "Next",
        options: actions.map((action) => ({ value: action.value, label: action.label })),
      }),
    );
  };

  /** Print each row once, and never the spinner: a row in progress repeats. */
  const progress = ({ title, rows = [] }) => {
    if (!printed.has(title)) {
      printed.add(title);
      out(`\n${title}`);
    }

    for (const row of rows) {
      if (row.text.startsWith(GLYPHS.spinner[0]) || printed.has(row.text)) {
        continue;
      }

      printed.add(row.text);
      out(`  ${row.text}`);
    }
  };

  return {
    setStep: (index) => {
      step = index;
    },
    ask,
    askPath,
    confirm,
    progress,
    close: () => {},
  };
}
