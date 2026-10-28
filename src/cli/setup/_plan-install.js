/**
 * @module cli/setup/plan-install
 *
 * Assembling the install plan from the wizard's answers.
 *
 * Order matters: the runtime home and the shim come first because the agent
 * writes reference the launcher, and the health check comes last because it
 * is the only step that reports on all the others.
 */

import { agentInstallTask, runtimeHomeTask, shimTask } from "./_task-core.js";
import { commandsTask, dockerTask, doctorTask, manifestTask, rulesTask, serviceTask, skillsTask } from "./_task-extras.js";
import { featuresTask } from "./_task-features.js";
import { skillsRemovalTask } from "./_task-remove.js";
import { cliVerifyTask } from "./_task-cli.js";
import { allAgents } from "../installers/index.js";

/**
 * Refuse an agent list the plan cannot act on.
 *
 * The wizard's own list once carried a row whose id was `measured:none`, a note
 * about the study rather than a product, so ticking it put a task in the plan
 * that could only fail with `Unsupported agent`. The screen is fixed; this is
 * the boundary that keeps the next one from reintroducing it, because a plan
 * entry that cannot run is not a warning to report later - it is a broken plan.
 *
 * @param {string[]} agents
 * @returns {string[]}
 */
const checkedAgents = (agents) => {
  const known = new Set(allAgents);
  const unknown = agents.filter((agent) => !known.has(agent));

  if (unknown.length > 0) {
    throw new Error(`Not an agent name: ${unknown.map((agent) => `"${agent}"`).join(", ")}. A plan can only install into known agents.`);
  }

  return agents;
};

/** The dimensions a flag-driven install wrote, when no profile answered. */
const dimensionsOf = (extras, agents) => ({
  server: agents.length > 0,
  rules: Boolean(extras.rules),
  commands: Boolean(extras.commands),
  hooks: Boolean(extras.hooks),
  doctor: Boolean(extras.doctor),
});

/**
 * @param {{ agents?: string[], mode?: string, extras?: object, force?: boolean, context?: object, selection?: object|null, minimal?: boolean, surface?: object|null, profile?: string|null, dimensions?: object|null, features?: Array<{ id: string, level: string }>|string[], adrPolicy?: string|null }} answers
 * @returns {Array<{ id: string, title: string, detail: string, run: Function }>}
 */
export function buildInstallPlan({
  agents = [],
  mode = "stdio",
  extras = {},
  force = false,
  context = {},
  selection = null,
  minimal,
  surface,
  profile = null,
  dimensions = null,
  features = [],
  adrPolicy = null,
} = {}) {
  const targets = checkedAgents(agents);
  const plan = [runtimeHomeTask()];

  if ((Array.isArray(features) && features.length > 0) || adrPolicy) {
    plan.push(featuresTask({ features, adrPolicy }));
  }

  if (context.hasLocalBin) {
    plan.push(shimTask(context.localBin));
  }

  // The guard hooks are not a step of their own: they are written by the
  // Claude installer, so declining them is an argument to that install rather
  // than a task the plan can leave out. `extras` only ever carries the steps
  // that were kept, so the test is presence - `!== false` was true for an
  // absent key, which made the hooks impossible to decline.
  plan.push(...targets.map((agent) => agentInstallTask(agent, mode, force, extras.hooks === true, minimal, surface)));

  if (extras.rules) {
    plan.push(rulesTask(agents));
  }

  if (extras.commands) {
    plan.push(commandsTask(force, agents, selection));
  }

  if (extras.skills) {
    plan.push(skillsTask());
  } else {
    // The step owns the skill directories, so not selecting it means absent:
    // reconcile away whatever an earlier install copied, or the host keeps
    // discovering `/skill:rule-mcp-*` the user did not ask for. The task reports
    // "nothing to remove" when there is nothing to reconcile.
    plan.push(skillsRemovalTask());
  }

  if (mode === "daemon" && extras.service) {
    plan.push(serviceTask());
  }

  if (mode === "docker") {
    plan.push(dockerTask());
  }

  // The install proves its own launcher before it reports success: a shim on
  // PATH that does not answer is an install that failed, not a warning.
  plan.push(cliVerifyTask());

  // The manifest is written before the health check, so the check can read what
  // this run claims it installed instead of re-detecting it. It is written even
  // when every optional step was declined: "this machine has the server entry"
  // is exactly the fact the uninstall needs, and the dimensions say the rest.
  plan.push(
    manifestTask({
      mode,
      profile,
      dimensions: dimensions ?? dimensionsOf(extras, agents),
      surface,
      commands: selection,
    }),
  );

  if (extras.doctor) {
    plan.push(doctorTask());
  }

  return plan;
}
