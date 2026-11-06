/**
@module cli/commands/project
 *
 * `rule-mcp project add|remove`: the membership command for project-scope
 * installs.
 *
 * A project-scope install is remembered in `projects.json`, so "which projects
 * does this machine configure" is a store, not a guess. `add` reuses the
 * agents and the config kind of the most recently recorded project, which is
 * what makes the second checkout one command; `remove` takes back every config
 * the install wrote and drops the root from the store.
 *
 * @see ADR 184 - setup --scope project records projects.json and wires install writers
 */

import { resolve } from "node:path";

import { listProjects } from "../install/_projects.js";
import { PROJECT_HOST_IDS } from "../installers/_project-hosts.data.js";
import { projectAgentInstallTask, projectAgentRemovalTask, projectForgetTask, projectAgents, runtimeHomeTask } from "../setup/_task-project.js";
import { projectGitRemovalTask, projectGitTask } from "../setup/_task-git.js";
import { runPlan } from "../setup/_run-plan.js";

/** The most recently recorded project, or undefined when the store is empty. */
const lastRecorded = () => {
  const projects = listProjects();

  return projects.sort((left, right) => String(right.installedAt ?? "").localeCompare(String(left.installedAt ?? "")))[0];
};

/**
What a new project install copies from the last one.

The flag wins, then the last recorded project, then every project-capable
host: an empty store has nothing to copy, and refusing to guess an agent
list would make the first `project add` the only one that needs flags.

@param {{ agents?: string[], projectConfig?: "shared"|"local" }} [options]
@returns {{ agents: string[], projectConfig: "shared"|"local" }}
*/
export function projectDefaults({ agents, projectConfig } = {}) {
  const last = lastRecorded();
  const chosenAgents = agents?.length ? agents : (last?.agents ?? [...PROJECT_HOST_IDS]);

  return {
    agents: projectAgents(chosenAgents),
    projectConfig: projectConfig ?? last?.projectConfig ?? "shared",
  };
}

/**
Configure one project root, recording it.

@param {{ path?: string, agents?: string[], projectConfig?: "shared"|"local", dryRun?: boolean }} [options]
@returns {Promise<{ root: string, dryRun: boolean, results: object[] }>}
*/
export async function projectAdd({ path = process.cwd(), agents, projectConfig, dryRun = false } = {}) {
  const root = resolve(path);
  const chosen = projectDefaults({ agents, projectConfig });
  const plan = [runtimeHomeTask(), ...chosen.agents.map((agent) => projectAgentInstallTask(agent, root, chosen.projectConfig)), projectGitTask(root, chosen.projectConfig)];
  const results = await runPlan(plan, { dryRun });

  return { root, dryRun, projectConfig: chosen.projectConfig, agents: chosen.agents, results };
}

/**
Take back every config an install wrote into one project, and forget it.

@param {{ path?: string, dryRun?: boolean }} [options]
@returns {Promise<{ root: string, dryRun: boolean, results: object[] }>}
*/
export async function projectRemove({ path = process.cwd(), dryRun = false } = {}) {
  const root = resolve(path);
  const recorded = listProjects().find((project) => project.root === root);

  if (!recorded) {
    throw new Error(`Not a recorded project: ${root}`);
  }

  const plan = [
    ...(recorded.agents ?? []).map((agent) => projectAgentRemovalTask(agent, root, recorded.projectConfig ?? "shared", recorded.written?.[agent])),
    projectGitRemovalTask(root),
    projectForgetTask(root),
  ];
  const results = await runPlan(plan, { dryRun });

  return { root, dryRun, results };
}
