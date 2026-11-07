/** The wizard's rail: step lists, their order, and the plan the review screen builds. */

import { DIMENSIONS } from "../../install/_profiles.js";
import { buildInstallPlan } from "../_plan-install.js";
import { buildProjectInstallPlan } from "../_plan-project.js";

/** The rail labels, in the order the wizard lights them. */
export const INSTALL_STEPS = ["Preflight", "Profile", "Agents", "Scope", "Depth", "Transport", "Surface", "Features", "Review", "Install", "Done"];

/** The uninstall rail, in the same order. */
export const UNINSTALL_STEPS = ["Select", "Purge", "Review", "Remove", "Done"];

/** Where each install step sits on that rail. */
export const INSTALL_RAIL = { preflight: 0, profile: 1, agents: 2, scope: 3, depth: 4, transport: 5, surface: 6, features: 7, review: 8, install: 9, done: 10 };

/** Where each uninstall step sits on that rail. */
export const UNINSTALL_RAIL = { select: 0, purge: 1, review: 2, remove: 3, done: 4 };

/**
 * The install steps, always the same order.
 *
 * Surface is the only place that picks a tier: the slash-command files follow
 * that answer, so there is no separate Commands screen (ADR 169).
 *
 * @returns {string[]}
 */
export function installOrder() {
  return ["preflight", "profile", "agents", "scope", "depth", "transport", "surface", "features", "review"];
}

/**
 * The uninstall steps this machine needs.
 *
 * @param {{ hasPurge?: boolean }} [options]
 * @returns {string[]}
 */
export function uninstallOrder({ hasPurge = false } = {}) {
  return ["select", ...(hasPurge ? ["purge"] : []), "review"];
}

/** The dimensions map the manifest records. */
export const dimensionMap = (dimensions) => Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, dimensions.includes(dimension)]));

/**
 * The plan the review screen lists and the run executes.
 *
 * A project scope answers with the roots it writes and the kind of entry; a
 * global one answers with neither, and the two plans are built by the modules
 * that already own them.
 */
export const installPlan = ({ answers, context, force }) => {
  if (answers.scope === "project") {
    return buildProjectInstallPlan({
      agents: answers.dimensions.includes("server") ? answers.agents : [],
      projects: answers.projects ?? [],
      projectConfig: answers.projectConfig ?? "shared",
    });
  }

  return buildInstallPlan({
    agents: answers.dimensions.includes("server") ? answers.agents : [],
    mode: answers.mode,
    extras: {
      rules: answers.dimensions.includes("rules"),
      commands: answers.dimensions.includes("commands"),
      // A level below L3 does not ask for hooks, and the dimension list cannot
      // put one back: the confirmation is the level, not the checkbox.
      hooks: answers.dimensions.includes("hooks") && (answers.level === "auto" || answers.level === undefined || Number(answers.level.slice(1)) >= 3),
      doctor: answers.dimensions.includes("doctor"),
      // The platform service belongs to daemon mode and is automatic there.
      service: answers.mode === "daemon",
    },
    force,
    context,
    selection: answers.selection,
    surface: answers.surface,
    profile: answers.profile,
    dimensions: dimensionMap(answers.dimensions),
    features: Object.entries(answers.features ?? {}).map(([id, level]) => ({ id, level })),
    adrPolicy: answers.adrPolicy ?? null,
    // Only the agents this run installs into: an attribution write for an agent
    // whose config was not written would be a setting nobody asked for.
    attribution: answers.attribution ?? null,
    attributionAgents: answers.dimensions.includes("server") ? answers.agents : [],
  });
};
