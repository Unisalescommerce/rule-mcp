/**
 * @module cli/setup/options
 *
 * Turning command-line options into wizard defaults.
 *
 * Pure, so the flag semantics the shell installers documented can be tested
 * without running an install. The tri-state flags matter: `--skills` and
 * `--no-skills` are not the same as saying nothing, which is why the option
 * is `undefined` rather than `false` when it is absent.
 */

import { normalizeInstallMode } from "../installers/index.js";
import { selectionOf } from "../install/_selection-flags.js";
import { surfaceOf } from "../install/_surface-flags.js";
import { canRunPlainWizard } from "./_version-floor.js";

export { WIZARD_NODE_MIN, atLeast, canRenderWizard, canRunPlainWizard, versionParts, wizardRuntimeNote } from "./_version-floor.js";

/** Optional steps that run unless the caller opts out. */
export const DEFAULT_EXTRAS = ["rules", "commands", "hooks", "doctor"];

/**
 * Which optional steps a non-interactive run should perform.
 *
 * @param {{ rules?: boolean, commands?: boolean, hooks?: boolean, skills?: boolean, service?: boolean, doctor?: boolean, mode?: string }} options
 */
export function resolveExtras(options = {}) {
  const extras = new Set(DEFAULT_EXTRAS);
  const toggle = (id, value) => {
    if (value === true) {
      extras.add(id);
    } else if (value === false) {
      extras.delete(id);
    }
  };

  toggle("rules", options.rules);
  toggle("commands", options.commands);
  toggle("hooks", options.hooks);
  toggle("skills", options.skills);
  toggle("doctor", options.doctor);
  // The platform service belongs to daemon mode and is on by default there.
  toggle("service", options.service ?? options.mode === "daemon");

  return [...extras];
}

/**
 * Normalize every flag into the shape the apps and the plain runner expect.
 *
 * @param {object} options
 * @returns {{ mode: string, agents: string[]|null, extras: string[], selection: object|null, surface: object|null, dryRun: boolean, force: boolean, purge: boolean, keepConfig: boolean, interactive: boolean }}
 */
export function resolveSetupOptions(options = {}) {
  const scope = options.scope === "project" ? "project" : "global";
  // Project-scope installs are stdio only and never write global extras
  // (skills, platform service). Wizard UI for scope lands in a later slice.
  const mode = scope === "project" ? "stdio" : normalizeInstallMode(options.mode ?? "stdio");
  const projectOptions = scope === "project" ? { ...options, mode, skills: false, service: false } : { ...options, mode };
  const projects = Array.isArray(options.projects) ? options.projects : options.project ? [options.project] : [];

  return {
    mode,
    scope,
    projects,
    projectConfig: options.projectConfig === "local" ? "local" : "shared",
    refreshProjects: Boolean(options.refreshProjects),
    features: Array.isArray(options.features) ? options.features : [],
    adrPolicy: typeof options.adrPolicy === "string" && options.adrPolicy.trim() ? options.adrPolicy.trim() : null,
    // Attribution is a per-agent table, so a run carries the mode and the
    // agents it may touch; absent means "the documented ones, keeping what the
    // vendor already does" - the install writes nothing in that case.
    attribution: options.attribution === "hide" ? "hide" : options.attribution === "keep" ? "keep" : null,
    attributionAgents: Array.isArray(options.attributionAgent) ? options.attributionAgent : [],
    // The Surface step answers apart from the command files; absent leaves
    // the saved server config alone (see `applySurfaceEnv`). A flag arrives
    // as its spec string, the wizard as its answer: both normalize to one.
    surface: typeof options.surface === "string" ? surfaceOf({ surface: options.surface }) : (options.surface ?? null),
    // `--agent <name>` narrows the run to one target; absent means "whatever
    // detection found", which the caller resolves.
    agents: options.agent && options.agent !== "all" ? [options.agent] : null,
    extras: resolveExtras(projectOptions),
    // Null means no flag narrowed the command surface, which the plan reads as
    // "every command" - what an install wrote before the surface grew one per
    // skill. The wizard replaces it with whatever its commands step answered.
    selection: selectionOf(options.selection ?? {}),
    dryRun: Boolean(options.dryRun),
    force: Boolean(options.force),
    purge: Boolean(options.purge),
    keepConfig: Boolean(options.keepConfig),
    // A terminal is the only requirement: the mount picks the renderer when
    // the runtime can host it, and the plain prompts otherwise.
    interactive: options.interactive !== false && canRunPlainWizard(),
  };
}
