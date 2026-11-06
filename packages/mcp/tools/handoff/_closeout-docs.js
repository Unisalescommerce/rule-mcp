/**
 * @module tools/handoff/closeout-docs
 *
 * Walking the docs tree: which files are papers, and the small facts the ADR
 * records about one of them.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

/** Files that order work instead of being work. They never close out. */
export const NON_ARCHIVABLE = new Set(["plan-of-plans.md", "README.md", "DEPENDENCIES.md"]);

/** Matches of re in text. */
export function countMatches(text, re) {
  return (text.match(re) ?? []).length;
}

/** The first H1, carried into the ADR so the record keeps its name. */
export function titleOf(text, fallback) {
  return text.match(/^# (.+)$/m)?.[1].trim() || fallback;
}

/** The run date a working paper stamps on itself, or "". */
export function dateOf(text) {
  return text.match(/\*\*Date\*\*: (\S+)/)?.[1] || "";
}

/** Every Markdown file under a directory, relative to it, sorted. */
export function markdownFiles(dir, base = "") {
  let entries;

  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const found = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const relative = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      found.push(...markdownFiles(join(dir, entry.name), relative));
      continue;
    }

    if (!entry.name.endsWith(".md") || NON_ARCHIVABLE.has(entry.name)) {
      continue;
    }

    found.push(relative);
  }

  return found;
}
