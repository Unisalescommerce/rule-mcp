/** Off-trunk: pull duplicate numbered ADRs back into _pending. */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ADR_DIR, listExistingAdrs } from "../../../tools/adr/_files.js";
import { updateAdrIndex } from "../../../tools/adr/_adr-index.js";
import { createdAt } from "../../docs-numbering/_git.js";
import { PENDING_DIR } from "./_list.js";
import { onTrunk } from "./_trunk.js";

/**
 * When a merge leaves two ADRs on one number off the trunk, keep the older
 * file and move the newer back to `_pending/<slug>.md` as a Pending document.
 *
 * On a trunk this is a no-op: landing owns numbering there.
 *
 * @param {string} projectDir
 * @returns {{ settled: { number: number, kept: string, pending: string }[] }}
 */
export function settleDuplicateAdrs(projectDir) {
  if (onTrunk(projectDir)) {
    return { settled: [] };
  }

  const adrDir = join(projectDir, ADR_DIR);
  const byNumber = Map.groupBy(listExistingAdrs(adrDir), adr => adr.number);


  const settled = [];
  const pendingDir = join(projectDir, PENDING_DIR);

  for (const [number, group] of byNumber) {
    if (group.length < 2) {
      continue;
    }

    const ranked = [...group].sort((left, right) => {
      const leftAt = createdAt(projectDir, `${ADR_DIR}/${left.file}`);
      const rightAt = createdAt(projectDir, `${ADR_DIR}/${right.file}`);

      return leftAt - rightAt || left.file.localeCompare(right.file);
    });
    const [kept, ...dupes] = ranked;

    for (const dupe of dupes) {
      const slug = dupe.file.replace(/^\d+-/, "").replace(/\.md$/, "");
      mkdirSync(pendingDir, { recursive: true });
      const from = join(adrDir, dupe.file);
      const to = join(pendingDir, `${slug}.md`);

      if (!existsSync(from)) {
        continue;
      }

      const padded = String(number).padStart(3, "0");
      const body = readFileSync(from, "utf8").replace(new RegExp(`^# ${padded}:`, "m"), "# Pending:");

      writeFileSync(from, body);
      renameSync(from, to);
      settled.push({ number, kept: kept.file, pending: `${PENDING_DIR}/${slug}.md` });
    }
  }

  if (settled.length > 0) {
    updateAdrIndex(adrDir, listExistingAdrs(adrDir));
  }

  return { settled };
}
