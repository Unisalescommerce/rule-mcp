/**
 * The cursor arithmetic behind every list in the wizard.
 *
 * Pure, so the semantics that used to be buried in a React hook are asserted
 * here: the cursor steps over section headings, wraps at both ends, and a radio
 * list starts on the incoming answer rather than on row one.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { detailLines, enabledIds, initialCursor, markOf, moveCursor, selectableIndexes, windowFor } from "../_list.js";

const items = [{ id: "section:a", section: true }, { id: "a1" }, { id: "a2" }, { id: "section:b", section: true }, { id: "b1", disabled: true }, { id: "b2" }];

test("section headings are not selectable", () => {
  assert.deepEqual(selectableIndexes(items), [1, 2, 4, 5]);
});

test("a disabled row stays reachable but cannot be ticked", () => {
  assert.deepEqual(enabledIds(items), ["a1", "a2", "b2"]);
});

test("the cursor wraps in both directions", () => {
  const indexes = selectableIndexes(items);

  assert.equal(moveCursor(indexes, 1, -1), 5, "up from the first row wraps to the last");
  assert.equal(moveCursor(indexes, 5, 1), 1, "down from the last row wraps to the first");
  assert.equal(moveCursor(indexes, 2, 1), 4, "a disabled row is still navigable, so its detail can explain why");
});

test("an empty list leaves the cursor alone", () => {
  assert.equal(moveCursor([], 3, 1), 3);
});

test("a cursor that is not on a row lands on the first one", () => {
  assert.equal(moveCursor([1, 2], 0, 1), 1);
});

test("a radio list starts on the incoming answer", () => {
  assert.equal(initialCursor(items, [1, 2, 5], ["b2"], "radio"), 5);
  assert.equal(initialCursor(items, [1, 2, 5], ["nope"], "radio"), 1, "an unknown answer falls back to the first row");
});

test("a checkbox list always starts at the top", () => {
  assert.equal(initialCursor(items, [1, 2, 5], ["b2"], "check"), 1);
});

test("the window keeps the cursor inside a short terminal", () => {
  assert.deepEqual(windowFor(3, 0, 10), { start: 0, end: 3 });
  assert.deepEqual(windowFor(40, 20, 10), { start: 15, end: 25 });
  assert.deepEqual(windowFor(40, 0, 10), { start: 0, end: 10 });
  assert.deepEqual(windowFor(40, 39, 10), { start: 30, end: 40 });
});

test("the mark depends on the list's mode", () => {
  assert.equal(markOf(true, "check"), "checked");
  assert.equal(markOf(false, "check"), "unchecked");
  assert.equal(markOf(true, "radio"), "radioOn");
  assert.equal(markOf(false, "radio"), "radioOff");
});

test("a detail string is one line, never a character per row", () => {
  assert.deepEqual(detailLines("~/.claude.json"), ["~/.claude.json"]);
  assert.deepEqual(detailLines(["a", "b"]), ["a", "b"]);
  assert.deepEqual(detailLines(""), []);
  assert.deepEqual(detailLines(null), []);
});
