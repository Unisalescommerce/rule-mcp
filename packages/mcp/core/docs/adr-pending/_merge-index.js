/** Git merge driver: regenerate ADR.md / HANDOFF.md instead of merging. */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { buildAdrIndex, listExistingAdrs } from "../../../tools/adr/index.js";
import { buildHandoffIndex, listExistingHandoffs } from "../../../tools/handoff/_handoff-index.js";

/**
 * Regenerate a generated index at `path` from the files on disk.
 *
 * Git calls this as `merge-index %O %A %B %P`. `%A` is the working-tree file
 * we overwrite; `%P` is the path inside the repository.
 *
 * @param {string} _ancestor - %O unused: indexes are never three-way merged
 * @param {string} oursPath - %A working copy to overwrite
 * @param {string} _theirs - %B unused
 * @param {string} repoPath - %P path relative to the project root
 * @param {{ projectDir?: string }} [options]
 * @returns {{"regenerated": boolean, kind: "adr" | "handoff" | null}}
 */
export function mergeGeneratedIndex(_ancestor, oursPath, _theirs, repoPath, options = {}) {
  const projectDir = options.projectDir ?? inferProjectDir(oursPath, repoPath);
  const normalized = repoPath.replaceAll("\\", "/");

  if (normalized.endsWith("docs/adr/ADR.md") || normalized === "docs/adr/ADR.md") {
    const adrDir = join(projectDir, "docs", "adr");
    writeFileSync(oursPath, buildAdrIndex(listExistingAdrs(adrDir)));

    return { regenerated: true, kind: "adr" };
  }

  if (normalized.endsWith("docs/handoff/HANDOFF.md") || normalized === "docs/handoff/HANDOFF.md") {
    const handoffDir = join(projectDir, "docs", "handoff");
    writeFileSync(oursPath, buildHandoffIndex(listExistingHandoffs(handoffDir)));

    return { regenerated: true, kind: "handoff" };
  }

  return { regenerated: false, kind: null };
}

/**
 * Infer the project root from the absolute working-tree path and the repo path.
 *
 * @param {string} oursPath
 * @param {string} repoPath
 * @returns {string}
 */
function inferProjectDir(oursPath, repoPath) {
  const absolute = oursPath.replaceAll("\\", "/");
  const relative = repoPath.replaceAll("\\", "/");
  const index = absolute.lastIndexOf(`/${relative}`);

  if (index !== -1) {
    return absolute.slice(0, index);
  }

  return dirname(dirname(dirname(oursPath)));
}
