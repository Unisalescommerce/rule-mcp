/**
@module cli/installers/rules-project
 *
 * Refresh a rules block a project already carries.
 *
 * A global install never writes into a project, so a block committed there
 * keeps the text it was installed with forever. The refresh only touches files
 * that already hold the marker: a project without a block is left to its own
 * conventions, and no file is created.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

import { readText, writeText } from "./_paths.js";
import { appendInstruction, carriesBlock } from "./_writers-text.js";

/** The files a project may carry the block in. */
export const PROJECT_RULE_FILES = ["CLAUDE.md", "AGENTS.md", "GEMINI.md", ".cursorrules"];

/**
 * Replace the stale block in every file that has one, keeping the rest.
 *
 * @param {string} project
 * @param {{ dryRun?: boolean }} [options]
 * @returns {Array<{ file: string, status: "refreshed"|"current"|"absent"|"planned" }>}
 */
export function refreshProjectRules(project, { dryRun = false } = {}) {
  return PROJECT_RULE_FILES.map((name) => {
    const file = join(project, name);

    if (!existsSync(file)) {
      return { file, status: "absent" };
    }

    const current = readText(file);

    if (!carriesBlock(current)) {
      return { file, status: "absent" };
    }

    const next = appendInstruction(current, { refresh: true });

    if (next === current) {
      return { file, status: "current" };
    }

    if (dryRun) {
      return { file, status: "planned" };
    }

    writeText({ file, content: next, dryRun: false });

    return { file, status: "refreshed" };
  });
}
