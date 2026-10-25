/**
 * @module core/guardrails/workflow/lines
 *
 * The indentation primitives a workflow file needs, and nothing else.
 *
 * Workflows are written by people and templates; what matters is two keys and a
 * list. These helpers read `KEY: value` entries, nested maps and `- ` lists by
 * counting leading spaces, so no YAML parser enters the dependency list.
 *
 * What they refuse, they refuse whole: a tab in the indentation, an anchor, a
 * merge key. A rule that passes on a file it cannot read costs less than a rule
 * that blocks a legitimate release on a parser limitation.
 */

const KEY = /^([A-Za-z_][\w.-]*):(?:\s+(.*))?$/u;
const LIST = /^( *)-(?: (.*))?$/u;

/** The leading spaces of a line. */
export const indentOf = (line) => line.length - line.replace(/^ +/u, "").length;

/** Blank lines and comments carry no structure. */
export const ignores = (line) => line.trim() === "" || line.trimStart().startsWith("#");

/** A map value with its trailing comment removed. */
export const clean = (value = "") => value.replace(/\s+#.*$/u, "").trim();

/** One `key: value` line, without a dangling space when the value is empty. */
export const lineOf = (entry) => (entry.value ? `${entry.key}: ${entry.value}` : `${entry.key}:`);

/** `KEY: value` entries at exactly `level`, each with the more-indented lines below it. */
export function entriesAt(lines, level) {
  const entries = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const match = ignores(line) || indentOf(line) === level ? line.trim().match(KEY) : null;

    if (!match) {
      index += 1;
      continue;
    }

    let next = index + 1;
    const body = [];

    while (next < lines.length && (ignores(lines[next]) || indentOf(lines[next]) > level)) {
      body.push(lines[next]);
      next += 1;
    }

    entries.push({ key: match[1], value: clean(match[2]), body });
    index = next;
  }

  return entries;
}

/** The indentation a block's own entries sit at, or -1 when it holds none. */
export function childLevel(body) {
  const first = body.find((line) => !ignores(line));

  return first === undefined ? -1 : indentOf(first);
}

/** The entries of a nested map, empty for a scalar or an empty block. */
export function mapOf(body) {
  const level = childLevel(body);

  return level < 0 ? [] : entriesAt(body, level);
}

/** A list block split into one entry list per `- ` item. */
export function itemsOf(body) {
  const items = [];
  const first = body.find((line) => !ignores(line));
  const listLevel = first?.match(LIST)?.[1].length ?? -1;

  if (listLevel < 0) {
    return items;
  }

  for (const line of body) {
    const match = ignores(line) ? null : line.match(LIST);

    if (match && match[1].length === listLevel) {
      // Re-align the item's first line to its content column so the item reads
      // as a map at one indentation, whichever of `- key: v` forms was used.
      const rest = line.slice(match[1].length + 1);
      const content = match[1].length + 1 + (rest.length - rest.trimStart().length);

      items.push([" ".repeat(content) + rest.trimStart()]);
      continue;
    }

    if (items.length > 0) {
      items.at(-1).push(line);
    }
  }

  return items.map(mapOf);
}

/** The text of a `key:` that may be inline or a block scalar. */
export function blockOf(entry) {
  if (!entry) {
    return "";
  }

  return /^[|>]/u.test(entry.value)
    ? entry.body
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n")
    : entry.value;
}

/** The `scope: access` lines of a permissions block, or its scalar form. */
export function permissionsOf(entry) {
  if (!entry) {
    return [];
  }

  return entry.value ? [entry.value] : mapOf(entry.body).map(lineOf);
}

/** The `NAME: value` lines of an env block, or its inline form. */
export function envOf(entry) {
  if (!entry) {
    return [];
  }

  return entry.value ? [entry.value] : mapOf(entry.body).map(lineOf);
}
