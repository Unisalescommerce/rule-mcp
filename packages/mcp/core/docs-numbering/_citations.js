/**
 * @module core/docs-numbering/citations
 *
 * Every form a citation takes, rewritten in every tree that carries one.
 *
 * A number in a filename is an alias. When the alias moves, the documents that
 * point at it move with it, or a reader follows a citation to a different
 * decision. Three forms cover what the tree writes: the link
 * `[214](214-slug.md)`, whose label and target both move; the path
 * `214-slug.md`, with or without a directory in front of it; and the prose
 * `ADR 214`, `ADR 0214`, and the paired `ADR 214/218`, which moves only the
 * number that moved.
 *
 * A mention in any other form is reported, not ignored: the caller decides
 * what to do with it, and a silent miss is the failure this exists to prevent.
 *
 * Test files are skipped. A fixture writes `069-personas.md` to mean "a
 * document numbered 069", not "the decision 069 holds", and its numbers are
 * arranged to exercise the code. Rewriting half of a consistent fixture leaves
 * the bare numbers it asserts on, which is how one run broke four tests.
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
 * Whether a path is a test or a fixture, whose numbers are arranged, not cited.
 *
 * @param {string} path
 * @returns {boolean}
 */
export function isFixture(path) {
  return /(?:^|\/)(?:__tests__|tests|fixtures)\//u.test(path) || /\.(?:test|spec)\.[cm]?js$/u.test(path);
}

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

  const files = CITATION_ROOTS.flatMap((root) => citableFiles(join(projectDir, root))).filter((file) => !isFixture(file));
  const unresolved = [];
  let filesUpdated = 0;
  let replacements = 0;

  onProgress({ step: "citations", message: `Reading ${files.length} file(s) for citations` });

  for (const file of files) {
    const before = readFileSync(file, "utf8");
    let after = before;
    let moved = 0;

    for (const rename of renames) {
      const oldFile = `${rename.fromNumber}-${rename.slug}.md`;
      const newFile = `${rename.toNumber}-${rename.slug}.md`;
      const oldLink = `[${rename.fromNumber}](${oldFile})`;
      const newLink = `[${rename.toNumber}](${newFile})`;
      const prose = prosePattern(rename.fromNumber);

      moved += countOf(after, oldLink);
      after = after.replaceAll(oldLink, newLink);
      moved += countOf(after, oldFile);
      after = after.replaceAll(oldFile, newFile);
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
