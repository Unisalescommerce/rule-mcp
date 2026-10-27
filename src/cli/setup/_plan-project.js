/**
 * @module cli/setup/plan-project
 *
 * Install / refresh / uninstall plans that touch project trees only.
 * Global shim, skills and platform service stay out of these plans (ADR 193).
 */

import { resolve } from "node:path";

import { listProjects } from "../install/_projects.js";
import { projectAgentInstallTask, projectAgentRemovalTask, projectAgents, projectForgetTask, refreshTasksFromStore, runtimeHomeTask } from "./_task-project.js";

/**
 * Build the flag-driven project-scope install plan.
 *
 * @param {{
 *   agents?: string[],
 *   projects?: string[],
 *   projectConfig?: "shared"|"local",
 * }} answers
 * @returns {Array<{ id: string, title: string, detail: string, run: Function }>}
 */
export function buildProjectInstallPlan({ agents = [], projects = [], projectConfig = "shared" } = {}) {
  if (!projects.length) {
    throw new Error("--scope project requires at least one --project <path>");
  }

  const targets = projectAgents(agents);
  const plan = [runtimeHomeTask()];

  for (const projectRoot of projects.map((root) => resolve(root))) {
    for (const agent of targets) {
      plan.push(projectAgentInstallTask(agent, projectRoot, projectConfig));
    }
  }

  return plan;
}

/**
 * Re-apply MCP configs into every root recorded in `projects.json`.
 *
 * @returns {Array<{ id: string, title: string, detail: string, run: Function }>}
 */
export function buildProjectRefreshPlan() {
  const tasks = refreshTasksFromStore();

  if (tasks.length === 0) {
    return [
      {
        id: "project-refresh-empty",
        title: "Refresh projects",
        detail: "projects.json is empty",
        run: () => ({ status: "ok", summary: "nothing to refresh" }),
      },
    ];
  }

  return [runtimeHomeTask(), ...tasks];
}

/**
 * Remove every recorded project install and forget the store entries.
 *
 * @returns {Array<{ id: string, title: string, detail: string, run: Function }>}
 */
export function buildProjectUninstallPlan() {
  const recorded = listProjects();
  const plan = [];

  for (const entry of recorded) {
    for (const agent of entry.agents ?? []) {
      plan.push(projectAgentRemovalTask(agent, entry.root, entry.projectConfig ?? "shared", entry.written?.[agent]));
    }

    plan.push(projectForgetTask(entry.root));
  }

  return plan;
}
