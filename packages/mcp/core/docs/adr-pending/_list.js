/** Pending ADR files under docs/adr/_pending/, ordered for deterministic landing. */
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { createdAt } from "../../docs-numbering/_git.js";

/** Directory of unnumbered ADRs, relative to the project root. */
export const PENDING_DIR = "docs/adr/_pending";

/**
 * Pending ADRs ordered by first-add commit, ties broken by slug.
 *
 * A squash that stamps every file with the same add commit falls back to
 * alphabetical slug order so two people landing the same pull write the same tree.
 *
 * @param {string} projectDir
 * @returns {{ slug: string, file: string, path: string, createdAt: number }[]}
 */
export function listPendingAdrs(projectDir) {
  const dir = join(projectDir, PENDING_DIR);
  let names;

  try {
    names = readdirSync(dir).filter((name) => name.endsWith(".md"));
  } catch {
    return [];
  }

  return names
    .map((file) => {
      const slug = file.slice(0, -3);
      const path = `${PENDING_DIR}/${file}`;

      return { slug, file, path, createdAt: createdAt(projectDir, path) };
    })
    .sort((left, right) => left.createdAt - right.createdAt || left.slug.localeCompare(right.slug));
}
