/**
@module cli/setup/task-rules
 *
 * The per-project rules step: replace a block the project already carries with
 * the one this install ships.
 *
 * A global install never writes into a project, so the block a project committed
 * keeps its old text until something refreshes it. This refreshes the files that
 * already hold a block and leaves the rest alone.
 */

import { resolve } from "node:path";

import { refreshProjectRules } from "../installers/_rules-project.js";

/** Refresh the rules block a project already carries. */
export const projectRulesTask = (projectRoot) => {
  const root = resolve(projectRoot);

  return {
    id: `project-rules:${root}`,
    title: `Rules block in ${root}`,
    detail: "refresh the block the project carries",
    run: ({ dryRun }) => {
      const results = refreshProjectRules(root, { dryRun });
      const touched = results.filter((entry) => entry.status === "refreshed" || entry.status === "planned");

      return {
        status: "ok",
        summary: touched.length > 0 ? `${touched.length} file(s)` : "current",
        lines: touched.map((entry) => `${entry.status.padEnd(9)} ${entry.file}`),
      };
    },
  };
};
