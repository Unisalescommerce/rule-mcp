/** Number pending ADRs when they land on a trunk branch. */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ADR_DIR, listExistingAdrs, nextAdrNumber } from "../../../tools/adr/_files.js";
import { updateAdrIndex } from "../../../tools/adr/_adr-index.js";
import { listPendingAdrs, PENDING_DIR } from "./_list.js";
import { rewritePendingReferences } from "./_rewrite.js";
import { onTrunk } from "./_trunk.js";

/**
 * Promote every pending ADR to the next free numbers on a trunk.
 *
 * Off-trunk calls are a no-op so feature branches keep writing pending files.
 * Ordering comes from {@link listPendingAdrs}; two landings of the same tree
 * therefore assign the same numbers.
 *
 * @param {string} projectDir
 * @param {{ commit?: boolean, quiet?: boolean }} [options]
 * @returns {{ landed: { slug: string, number: number, file: string }[], referencesUpdated: number, committed: boolean, skipped: string | null }}
 */
export function landPendingAdrs(projectDir, options = {}) {
  if (!onTrunk(projectDir)) {
    return { landed: [], referencesUpdated: 0, committed: false, skipped: "not on a trunk branch" };
  }

  const pending = listPendingAdrs(projectDir);

  if (pending.length === 0) {
    return { landed: [], referencesUpdated: 0, committed: false, skipped: null };
  }

  const adrDir = join(projectDir, ADR_DIR);
  mkdirSync(adrDir, { recursive: true });

  let next = nextAdrNumber(adrDir);
  const landed = [];

  for (const entry of pending) {
    const from = join(projectDir, entry.path);

    if (!existsSync(from)) {
      continue;
    }

    const number = next;
    next += 1;
    const padded = String(number).padStart(3, "0");
    const file = `${padded}-${entry.slug}.md`;
    const to = join(adrDir, file);
    const body = readFileSync(from, "utf8").replace(/^# Pending:/m, `# ${padded}:`);

    writeFileSync(from, body);
    renameSync(from, to);
    landed.push({ slug: entry.slug, number, file });
  }

  const pendingDir = join(projectDir, PENDING_DIR);

  try {
    if (existsSync(pendingDir) && listPendingAdrs(projectDir).length === 0) {
      rmSync(pendingDir, { recursive: true, force: true });
    }
  } catch {
    /* keep an empty pending dir rather than fail the land */
  }

  const referencesUpdated = rewritePendingReferences(projectDir, landed);
  updateAdrIndex(adrDir, listExistingAdrs(adrDir));

  let committed = false;

  if (options.commit && landed.length > 0) {
    committed = commitLanding(projectDir, landed, { quiet: options.quiet });
  }

  return { landed, referencesUpdated, committed, skipped: null };
}

/**
 * Stage the landed files and indexes, then commit when the tree is dirty.
 *
 * @param {string} projectDir
 * @param {{ slug: string, number: number, file: string }[]} landed
 * @param {{ quiet?: boolean }} [options]
 * @returns {boolean}
 */
function commitLanding(projectDir, landed, options = {}) {
  const paths = [
    ...landed.map((entry) => join(ADR_DIR, entry.file)),
    join(ADR_DIR, "ADR.md"),
    PENDING_DIR,
  ];

  try {
    execFileSync("git", ["add", "-A", "--", ...paths], {
      cwd: projectDir,
      stdio: options.quiet ? "ignore" : ["ignore", "pipe", "pipe"],
    });
    execFileSync(
      "git",
      ["-c", "core.hooksPath=/dev/null", "commit", "--no-verify", "-m", "docs(adr): number pending ADRs on landing"],
      {
        cwd: projectDir,
        stdio: options.quiet ? "ignore" : ["ignore", "pipe", "pipe"],
      },
    );

    return true;
  } catch {
    return false;
  }
}
