/**
@module test/setup/widget-path

The path field, as a reducer. Every keystroke the menu answers is decided here,
with no renderer in the module: Tab opens and Tab applies, the arrows wrap, Esc
closes before it goes back, and a burst of backspaces deletes a character each
because the terminal delivers the burst as one chunk.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { pathKey, pathState } from "../_widget-path.js";
import { pathView, visibleRows } from "../_path-menu.js";

const root = mkdtempSync(join(tmpdir(), "rule-widget-path-"));

for (const name of ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota"]) {
  mkdirSync(join(root, name));
}

writeFileSync(join(root, "afile.txt"), "x");

test.after(() => rmSync(root, { recursive: true, force: true }));

const press = (state, key) => pathKey(state, key);
const type = (state, sequence) => press(state, { name: sequence.length > 1 ? "backspace" : undefined, sequence });

const kind = (state, text) => {
  let next = state;

  for (const character of text) {
    next = pathKey(next, { name: undefined, sequence: character });
  }

  return next;
};

test("a fresh field is closed and empty", () => {
  const state = pathState({ cwd: root });

  assert.equal(state.text, "");
  assert.equal(state.open, false);
  assert.deepEqual(pathView(state).items, []);
});

test("Tab opens the menu, and a slash already typed shows the folders", () => {
  const state = pathKey(kind(pathState({ cwd: root }), "./"), { name: "tab" });

  assert.equal(state.open, true);
  assert.equal(state.cursor, 0);
  assert.equal(pathView(state).items[0].value, "./alpha/");
});

test("down and up wrap around the list", () => {
  const opened = pathKey(kind(pathState({ cwd: root }), "./"), { name: "tab" });
  const first = press(opened, { name: "up" });

  assert.equal(first.cursor, pathView(opened).items.length - 1, "up from the first row wraps to the last");

  const back = press(first, { name: "down" });

  assert.equal(back.cursor, 0, "and down from the last wraps to the first");
});

test("Tab on an open menu applies the selection and closes it", () => {
  const opened = pathKey(kind(pathState({ cwd: root }), "./"), { name: "tab" });
  const applied = pathKey(press(opened, { name: "down" }), { name: "tab" });

  assert.equal(applied.open, false);
  assert.equal(applied.text, "./beta/", "the value ends in a slash, so the next Tab descends");
});

test("Enter applies the selection too", () => {
  const opened = pathKey(kind(pathState({ cwd: root }), "./"), { name: "tab" });
  const applied = pathKey(opened, { name: "return" });

  assert.equal(applied.open, false);
  assert.equal(applied.text, "./alpha/");
});

test("typing closes the menu", () => {
  const opened = pathKey(kind(pathState({ cwd: root }), "./"), { name: "tab" });
  const typed = pathKey(opened, { name: undefined, sequence: "a" });

  assert.equal(typed.open, false);
  assert.equal(typed.text, "./a");
});

test("Esc closes the menu, and goes back when none is open", () => {
  const opened = pathKey(kind(pathState({ cwd: root }), "./"), { name: "tab" });
  const closed = press(opened, { name: "escape" });

  assert.equal(closed.open, false, "the first Esc closes");
  assert.equal(closed.done, undefined, "and does not leave the field");

  const leaving = press(closed, { name: "escape" });

  assert.deepEqual(leaving.done, { type: "back" });
});

test("a burst of backspaces deletes one character each", () => {
  const typed = kind(pathState({ cwd: root }), "./alpha");
  const burst = press(typed, { name: "backspace", sequence: "\u007F\u007F\u007F" });
  const single = press(press(press(typed, { name: "backspace" }), { name: "backspace" }), { name: "backspace" });

  assert.equal(burst.text, single.text, "the burst and three single presses agree");
  assert.equal(burst.text, "./al");
});

test("the menu shows eight rows and reports where it is", () => {
  const opened = pathKey(kind(pathState({ cwd: root }), "./"), { name: "tab" });
  const view = pathView(opened);

  assert.equal(visibleRows(), 8);
  assert.equal(view.total, 9, "nine folders, and the file is not one");
  assert.deepEqual(view.window, { start: 0, end: 8 });
  assert.equal(view.footer, "1/9");

  const last = press(opened, { name: "up" });
  const scrolled = pathView(last);

  assert.deepEqual(scrolled.window, { start: 1, end: 9 }, "the window follows the cursor");
  assert.equal(scrolled.footer, "9/9");
});
