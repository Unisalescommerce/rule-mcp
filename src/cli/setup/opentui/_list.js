/**
 * @module cli/setup/opentui/list
 *
 * Cursor and window arithmetic for a selectable list, with no renderer in it.
 *
 * Section headings live in the same array as the entries so the list draws in
 * one pass; the cursor has to step over them, which is why moving is a search
 * for the next selectable index rather than an increment. All of it is pure so
 * the semantics are tested without a terminal.
 */

/**
 * The indices the cursor may land on.
 *
 * @param {Array<{ section?: boolean }>} items
 * @returns {number[]}
 */
export const selectableIndexes = (items) => items.flatMap((item, index) => (item.section ? [] : [index]));

/**
 * The slice of items to draw, keeping the cursor inside it.
 *
 * Windowed rather than full-height: the agent catalog is longer than a short
 * terminal, and a list that overflows the frame pushes the key bar off screen
 * where nobody finds it again.
 *
 * @param {number} total
 * @param {number} cursor
 * @param {number} height
 * @returns {{ start: number, end: number }}
 */
export function windowFor(total, cursor, height) {
  if (total <= height) {
    return { start: 0, end: total };
  }

  const start = Math.min(Math.max(0, cursor - Math.floor(height / 2)), total - height);

  return { start, end: start + height };
}

/**
 * Where the cursor starts.
 *
 * In radio mode the highlighted row is the choice, so a cursor that ignored
 * the incoming value would silently answer the question with row one - a
 * daemon install offered stdio, a standard profile offered minimal.
 *
 * @param {object[]} items
 * @param {number[]} indexes - the rows the cursor may land on
 * @param {string[]} [initial]
 * @param {"check"|"radio"} [mode]
 * @returns {number}
 */
export function initialCursor(items, indexes, initial = [], mode = "check") {
  const preselected = mode === "radio" ? indexes.find((index) => initial.includes(items[index]?.id)) : undefined;

  return preselected ?? indexes[0] ?? 0;
}

/**
 * The ids a tick can actually apply to.
 *
 * A disabled row stays reachable so its detail panel can explain why it is
 * disabled, but it cannot be selected: a tick the plan then ignores is a
 * promise the install does not keep.
 *
 * @param {object[]} items
 * @returns {string[]}
 */
export const enabledIds = (items) => items.filter((item) => !item.section && !item.disabled).map((item) => item.id);

/**
 * The next selectable row, wrapping at either end.
 *
 * @param {number[]} indexes
 * @param {number} cursor
 * @param {number} delta
 * @returns {number}
 */
export function moveCursor(indexes, cursor, delta) {
  if (indexes.length === 0) {
    return cursor;
  }

  const position = indexes.indexOf(cursor);

  if (position === -1) {
    return indexes[0];
  }

  return indexes[(position + delta + indexes.length) % indexes.length];
}

/**
 * The mark a row shows in front of its label.
 *
 * @param {boolean} selected
 * @param {"check"|"radio"} mode
 * @returns {"checked"|"unchecked"|"radioOn"|"radioOff"}
 */
export function markOf(selected, mode) {
  if (mode === "radio") {
    return selected ? "radioOn" : "radioOff";
  }

  return selected ? "checked" : "unchecked";
}

/**
 * Normalize a detail field into lines the panel can paint.
 *
 * A bare string is one line, never a sequence of characters: iterating a
 * string with `for...of` in the renderer was drawing one glyph per row.
 *
 * @param {string|string[]|null|undefined} detail
 * @returns {string[]}
 */
export function detailLines(detail) {
  if (Array.isArray(detail)) {
    return detail;
  }

  if (typeof detail === "string" && detail.length > 0) {
    return [detail];
  }

  return [];
}
