/** Rewrite pending ADR references to their landed numbers across docs/. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { markdownFiles } from "../../docs-numbering/_families.js";

/**
 * Replace every `ADR <slug>` and `_pending/<slug>.md` mention with the landed number.
 *
 * @param {string} projectDir
 * @param {{ slug: string, number: number, file: string }[]} landed
 * @returns {number} files updated
 */
export function rewritePendingReferences(projectDir, landed) {
  if (landed.length === 0) {
    return 0;
  }

  let updated = 0;
  const docsRoot = join(projectDir, "docs");

  for (const absolute of markdownFiles(docsRoot)) {
    const before = readFileSync(absolute, "utf8");
    let after = before;

    for (const entry of landed) {
      const padded = String(entry.number).padStart(3, "0");
      const pendingPath = `docs/adr/_pending/${entry.slug}.md`;
      const numberedPath = `docs/adr/${entry.file}`;

      after = after
        .replaceAll(`ADR ${entry.slug}`, `ADR ${padded}`)
        .replaceAll(pendingPath, numberedPath)
        .replaceAll(`_pending/${entry.slug}.md`, entry.file);
    }

    if (after === before) {
      continue;
    }

    writeFileSync(absolute, after);
    updated += 1;
  }

  return updated;
}
