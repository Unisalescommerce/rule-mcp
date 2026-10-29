/**
@module cli/setup/task-git
 *
 * The per-project git step: the pending-ADR landing hooks and the index merge
 * driver a project install writes into the repository it names.
 *
 * The hooks and the driver belong to a checkout, not to a user: a project that
 * gets rule-mcp without them lands ADRs by hand and resolves ADR.md conflicts
 * with a text merge. A `local` project install keeps the attributes private
 * (`.git/info/attributes`) so a teammate's clone does not inherit them.
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { isGitRepository } from "../../core/git/index.js";
import { applyLandHooks, planLandHooks, removeLandHooks } from "../../core/git-hooks/index.js";

/** The land command a hook runs, and the marker that makes an existing hook ours. */
const LAND_HOOK = ["#!/bin/sh", "# rule-mcp: number pending ADRs when they land on the trunk", "rule-mcp handoff land --quiet --commit", ""].join("\n");
const HOOK_MARKER = "# rule-mcp:";
const LAND_EVENTS = ["post-merge", "post-rewrite"];

/**
 * Write the two landing hooks, unless one is already there.
 *
 * `applyLandHooks` configures the driver and reports the hooks; it never creates
 * a hook file, because a hook is a script and a script is the repository's.
 *
 * @param {string} root
 * @param {{ dryRun: boolean }} options
 * @returns {{ written: string[], kept: string[] }}
 */
function writeLandHooks(root, { dryRun }) {
  const dir = join(root, ".githooks");
  const written = [];
  const kept = [];

  for (const event of LAND_EVENTS) {
    const path = join(dir, event);

    if (existsSync(path)) {
      kept.push(event);
      continue;
    }

    if (!dryRun) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(path, LAND_HOOK);
      chmodSync(path, 0o755);
    }

    written.push(event);
  }

  return { written, kept };
}

/** Delete the hook files this task wrote, and nothing else. */
function removeLandHookFiles(root) {
  const removed = [];

  for (const event of LAND_EVENTS) {
    const path = join(root, ".githooks", event);

    if (existsSync(path) && readFileSync(path, "utf8").includes(HOOK_MARKER)) {
      rmSync(path, { force: true });
      removed.push(event);
    }
  }

  return removed;
}

/**
 * Write the landing hooks and merge driver into one project.
 *
 * @param {string} projectRoot
 * @param {"shared"|"local"} projectConfig
 */
export const projectGitTask = (projectRoot, projectConfig) => {
  const root = resolve(projectRoot);

  return {
    id: `project-git:${root}`,
    title: `Numbering hooks in ${root}`,
    detail: `${projectConfig === "local" ? "private" : "tracked"} attributes, merge driver`,
    run: ({ dryRun }) => {
      // A project root is not always a checkout: a shared `.mcp.json` is useful
      // outside git, and a hook that needs one must say so instead of failing.
      if (!isGitRepository(root)) {
        return { status: "ok", summary: "not a git repository", lines: [`skipped the hooks: ${root} has no .git`] };
      }

      const planned = planLandHooks(root, { private: projectConfig === "local" });

      if (dryRun) {
        return {
          status: "ok",
          summary: "would write",
          lines: [
            ...planned.hooks.map((hook) => `hook ${hook.event}: ${hook.status}`),
            `driver: ${planned.driver}`,
            `attributes: ${planned.attributes}`,
          ],
        };
      }

      const hooks = writeLandHooks(root, { dryRun });
      const { preserved, written } = applyLandHooks(root, { private: projectConfig === "local" });
      const wrote = [...hooks.written, ...written];
      const kept = [...hooks.kept, ...preserved];

      return {
        status: "ok",
        summary: `${wrote.length} written, ${kept.length} preserved`,
        lines: [...wrote.map((item) => `wrote ${item}`), ...kept.map((item) => `kept ${item}`)],
      };
    },
  };
};

/** Take the landing hooks and merge driver back out of one project. */
export const projectGitRemovalTask = (projectRoot) => {
  const root = resolve(projectRoot);

  return {
    id: `project-git-remove:${root}`,
    title: `Remove numbering hooks in ${root}`,
    detail: "merge driver, private attributes",
    run: ({ dryRun }) => {
      if (dryRun) {
        return { status: "ok", summary: "would remove" };
      }

      if (!isGitRepository(root)) {
        return { status: "ok", summary: "not a git repository", lines: [] };
      }

      const hookFiles = removeLandHookFiles(root);
      const { removed } = removeLandHooks(root);
      const all = [...hookFiles, ...removed];

      return { status: "ok", summary: `${all.length} removed`, lines: all };
    },
  };
};
