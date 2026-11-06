/**
 * @module cli/setup/task-project
 *
 * Plan tasks for project-scope installs: write into a project tree, record
 * `projects.json`, and reverse both on uninstall/refresh.
 */

import { resolve } from "node:path";

import { entrypoint } from "../commands/_shared.js";
import { recordInstall } from "../install/_manifest.js";
import { forgetProject, listProjects, recordProject } from "../install/_projects.js";
import { installProjectHost, uninstallProjectHost } from "../installers/_install-project.js";
import { PROJECT_HOST_IDS } from "../installers/_project-hosts.data.js";

/** Agents that have a project MCP file, optionally narrowed by `--agent`. */
export function projectAgents(agents) {
  const allowed = new Set(PROJECT_HOST_IDS);
  const list = agents?.length ? agents.filter((agent) => allowed.has(agent)) : [...PROJECT_HOST_IDS];

  if (agents?.length && list.length === 0) {
    throw new Error(`Not a project-capable agent: ${agents.map((agent) => `"${agent}"`).join(", ")}`);
  }

  return list;
}

/**
 * Install one agent into one project root and record the written paths.
 *
 * @param {string} agent
 * @param {string} projectRoot
 * @param {"shared"|"local"} projectConfig
 */
export const projectAgentInstallTask = (agent, projectRoot, projectConfig) => {
  const root = resolve(projectRoot);

  return {
    id: `project:${root}:${agent}`,
    title: `Configure ${agent} in ${root}`,
    detail: `project-config ${projectConfig}`,
    run: ({ dryRun }) => {
      const result = installProjectHost({
        agent,
        projectRoot: root,
        projectConfig,
        entrypoint,
        dryRun,
      });

      recordProject({
        root,
        agents: [agent],
        projectConfig,
        written: { [agent]: result.written },
        dryRun,
      });
      recordInstall({
        agent,
        mode: "stdio",
        written: result.written,
        dimensions: { server: true },
        dryRun,
      });

      return {
        status: "ok",
        summary: dryRun ? "would configure" : "configured",
        lines: result.written,
      };
    },
  };
};

/**
 * Remove one agent from one recorded project root.
 *
 * @param {string} agent
 * @param {string} projectRoot
 * @param {"shared"|"local"} projectConfig
 * @param {string[]} [written]
 */
export const projectAgentRemovalTask = (agent, projectRoot, projectConfig, written) => {
  const root = resolve(projectRoot);

  return {
    id: `project-remove:${root}:${agent}`,
    title: `Clean ${agent} in ${root}`,
    detail: "remove the project MCP entry",
    run: ({ dryRun }) => {
      const result = uninstallProjectHost({
        agent,
        projectRoot: root,
        projectConfig,
        written,
        dryRun,
      });

      return {
        status: "ok",
        summary: dryRun ? "would remove" : "removed",
        lines: result.written,
      };
    },
  };
};

/** Drop one root from `projects.json` after its agents were cleaned. */
export const projectForgetTask = (projectRoot) => {
  const root = resolve(projectRoot);

  return {
    id: `project-forget:${root}`,
    title: `Forget ${root}`,
    detail: "projects.json",
    run: ({ dryRun }) => {
      forgetProject({ root, dryRun });

      return { status: "ok", summary: dryRun ? "would forget" : "forgotten" };
    },
  };
};

/** Re-apply every recorded project install (used by `--refresh-projects`). */
export function refreshTasksFromStore() {
  return listProjects().flatMap((entry) => (entry.agents ?? []).map((agent) => projectAgentInstallTask(agent, entry.root, entry.projectConfig ?? "shared")));
}

/** Ensure the runtime home exists before touching `state/projects.json`. */

export { runtimeHomeTask } from "./_task-core.js";
