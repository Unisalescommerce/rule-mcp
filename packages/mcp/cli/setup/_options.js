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

import { MINIMAL_ENV_VAR, normalizeInstallMode } from "../installers/index.js";
import { selectionOf } from "../install/_selection-flags.js";
import { surfaceOf } from "../install/_surface-flags.js";
import { canRenderWizard } from "./_version-floor.js";

export { WIZARD_NODE_MIN, atLeast, canRenderWizard, versionParts, wizardRuntimeNote } from "./_version-floor.js";

/** Optional steps that run unless the caller opts out. */
export const DEFAULT_EXTRAS = ["rules", "commands", "hooks", "doctor"];


/**
 * Carry a `--minimal` / `--no-minimal` answer into the process environment.
 *
 * The written server config mirrors the ambient value (see
 * `cli/installers/_env.js`), so the flag only has to arrive before the plan
 * runs. Absent touches nothing: neither a saved preference nor an ambient
 * value is created or clobbered by saying nothing.
 *
 * @param {boolean|undefined} minimal
 * @param {object} [env]
 */
export function applyMinimalEnv(minimal, env = process.env) {
  if (minimal === true) {
    env[MINIMAL_ENV_VAR] = "1";
  } else if (minimal === false) {
    env[MINIMAL_ENV_VAR] = "0";
  }
}

/**
 * Which optional steps a non-interactive run should perform.
 *
 * @param {{ rules?: boolean, commands?: boolean, hooks?: boolean, skills?: boolean, service?: boolean, doctor?: boolean, minimal?: boolean, mode?: string }} options
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
  // Minimal is not a step that runs, but the Extras screen is where the
  // wizard asks it, so the flag pre-checks that row the same way.
  toggle("minimal", options.minimal);
  // The platform service belongs to daemon mode and is on by default there.
  toggle("service", options.service ?? options.mode === "daemon");

  return [...extras];
}

/**
 * Normalize every flag into the shape the apps and the plain runner expect.
 *
 * @param {object} options
 * @returns {{ mode: string, agents: string[]|null, extras: string[], selection: object|null, minimal: boolean|undefined, surface: object|null, dryRun: boolean, force: boolean, purge: boolean, keepConfig: boolean, interactive: boolean }}
 */
export function resolveSetupOptions(options = {}) {
  const scope = options.scope === "project" ? "project" : "global";
  // Project-scope installs are stdio only and never write global extras
  // (skills, platform service). Wizard UI for scope lands in a later slice.
  const mode = scope === "project" ? "stdio" : normalizeInstallMode(options.mode ?? "stdio");
  const projectOptions = scope === "project" ? { ...options, mode, skills: false, service: false } : { ...options, mode };
  const projects = Array.isArray(options.projects) ? options.projects : options.project ? [].concat(options.project) : [];

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
    // `--minimal` / `--no-minimal` choose the installed server surface;
    // absent leaves the saved config alone (see `applyMinimalEnv`).
    minimal: options.minimal,
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
    interactive: options.interactive !== false && canRenderWizard(),
  };
}
