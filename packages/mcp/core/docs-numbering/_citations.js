/**
 * @module core/docs-numbering/citations
 *
 * Every form a citation takes, rewritten in every tree that carries one.
 *
 * A number in a filename is an alias. When the alias moves, the documents that
 * point at it have to move with it, or a reader follows a citation to a
 * different decision. The first version of this rewrite handled markdown links
 * under `docs/` only, which left a prose `ADR 214` in `docs/plans/` and a
 * `adr/214-slug.md` in `packages/` pointing at whatever took the old number
 * (ADR 219).
 *
 * Three forms, because the tree writes three:
 *
 * - the link `[214](214-slug.md)`, whose label and target both move;
 * - the path `214-slug.md`, with or without a directory in front of it;
 * - the prose `ADR 214`, `ADR 0214`, and the paired `ADR 214/218`, which moves
 *   only the number that moved.
 *
 * Anything else that still names a moved number is reported, not ignored. The
 * caller decides what to do with it; a silent miss is the failure this exists
 * to prevent.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** The trees that carry citations. */
export const CITATION_ROOTS = ["docs", "packages", "skills", "scripts"];

/** The files that can hold one. */
export const CITATION_EXTENSIONS = [".md", ".js", ".mjs", ".cjs"];

/** Directories that hold copies, not sources. */
const SKIP = new Set(["node_modules", ".git", "dist", "coverage", ".vitepress"]);

/**
 * Every citable file under one directory, recursively.
 *
 * @param {string} dir
 * @param {string[]} [found]
 * @returns {string[]}
 */
export function citableFiles(dir, found = []) {
  if (!existsSync(dir)) {
    return found;
  }

  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) {
      continue;
    }

    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      citableFiles(path, found);
    } else if (CITATION_EXTENSIONS.some((extension) => path.endsWith(extension))) {
      found.push(path);
    }
  }

  return found;
}

/** The prose form, matching the number with or without its leading zeros. */
function prosePattern(number) {
  return new RegExp(String.raw`\bADR\s+0*${number}\b`, "g");
}

/** The shape a mention takes when this rewrite does not own it, e.g. `adr-<number>-...`. */
function strayPattern(number) {
  return new RegExp(String.raw`\badr[-_]0*${number}\b`, "i");
}

/** How many times a literal appears in a text. */
function countOf(text, needle) {
  return needle === "" ? 0 : text.split(needle).length - 1;
}

/**
 * Rewrite every citation of every renamed document, across the whole tree.
 *
 * @param {{ projectDir?: string, renames?: object[], onProgress?: Function }} [options] - `renames` comes from `planRenumber`
 * @returns {{ filesUpdated: number, replacements: number, unresolved: Array<{ file: string, number: string }> }}
 */
export function rewriteCitations({ projectDir = ".", renames = [], onProgress = () => {} } = {}) {
  if (renames.length === 0) {
    return { filesUpdated: 0, replacements: 0, unresolved: [] };
  }

  const files = CITATION_ROOTS.flatMap((root) => citableFiles(join(projectDir, root)));

  onProgress({ step: "citations", message: `Reading ${files.length} file(s) for citations` });

  const unresolved = [];
  let filesUpdated = 0;
  let replacements = 0;

  for (const file of files) {
    const before = readFileSync(file, "utf8");
    let after = before;
    let moved = 0;

    for (const rename of renames) {
      const oldFile = `${rename.fromNumber}-${rename.slug}.md`;
      const newFile = `${rename.toNumber}-${rename.slug}.md`;
      const oldLink = `[${rename.fromNumber}](${oldFile})`;
      const newLink = `[${rename.toNumber}](${newFile})`;

      moved += countOf(after, oldLink);
      after = after.replaceAll(oldLink, newLink);

      // The target of a link that did not use the label form, and the bare path.
      moved += countOf(after, oldFile);
      after = after.replaceAll(oldFile, newFile);

      const prose = prosePattern(rename.fromNumber);
      moved += (after.match(prose) ?? []).length;
      after = after.replace(prose, `ADR ${rename.toNumber}`);
    }

    if (after !== before) {
      writeFileSync(file, after);
      filesUpdated += 1;
      replacements += moved;
    }

    for (const rename of renames) {
      if (strayPattern(rename.fromNumber).test(after)) {
        unresolved.push({ file, number: rename.fromNumber });
      }
    }
  }

  onProgress({
    step: "citations",
    message: `${replacements} citation(s) in ${filesUpdated} file(s)${unresolved.length > 0 ? `; ${unresolved.length} mention(s) left` : ""}`,
  });

  return { filesUpdated, replacements, unresolved };
}
