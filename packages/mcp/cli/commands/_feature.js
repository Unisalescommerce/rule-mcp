/**
 * @module cli/commands/feature
 *
 * `rule-mcp feature list | enable | disable` - own every user-facing switch.
 */

import { featureIds, FEATURES, levelsFor, readAllLevels, readLevel, setFeatureLevel } from "../../core/runtime/features/index.js";
import { mergedEnv } from "../../core/runtime/features/_store.js";
import { print } from "./_shared.js";

/**
 * Re-apply remembered installs so rules/commands/hooks follow the new level.
 *
 * Injected in tests; default walks the global manifest and projects.json.
 *
 * @returns {Promise<{ global: number, projects: number }>}
 */
export async function refreshRememberedInstalls() {
  const { readManifest } = await import("../install/_manifest.js");
  const { buildProjectRefreshPlan } = await import("../setup/_plan-project.js");
  const { runPlan } = await import("../setup/_run-plan.js");
  const { installCommand } = await import("./_lifecycle.js");

  const manifest = readManifest();
  const agents = manifest.agents ?? [];

  for (const agent of agents) {
    await installCommand({
      agent,
      mode: manifest.mode ?? "stdio",
      force: true,
      dryRun: false,
      json: true,
      hooks: manifest.dimensions?.hooks === true,
      minimal: undefined,
      surface: manifest.surface ?? undefined,
    });
  }

  const plan = buildProjectRefreshPlan();
  // `runPlan` takes the plan as its first argument; passing an object made the
  // re-apply throw as soon as it ran, so `feature enable` could not refresh the
  // projects it claims to refresh.
  const results = await runPlan(plan, { dryRun: false });

  // The empty store answers with a placeholder task, which is a report line and
  // not a project that was re-applied.
  const refreshed = results.filter((result) => result.id !== "project-refresh-empty");

  return { global: agents.length, projects: refreshed.length };
}

/**
 * Print every feature and its current level.
 *
 * @param {{ homeDir?: string }} [options]
 */
export function featureListCommand({ homeDir } = {}) {
  const levels = readAllLevels(mergedEnv({ homeDir, env: process.env }));
  const lines = ["Features:", ""];

  for (const id of featureIds()) {
    const level = levels[id];
    const choices = levelsFor(id).join("|");

    lines.push(`  ${id}=${level}`, `    ${FEATURES[id].label}`, `    levels: ${choices}`, "");
  }

  print(lines.join("\n"));
}

/**
 * Enable or set a feature level, then refresh remembered installs.
 *
 * @param {{
 *   id: string,
 *   level?: string,
 *   dryRun?: boolean,
 *   homeDir?: string,
 *   refresh?: () => Promise<{ global: number, projects: number }|void>|{ global: number, projects: number }|void,
 * }} options
 */
export async function featureEnableCommand({
  id,
  level = "enable",
  dryRun = false,
  homeDir,
  refresh = refreshRememberedInstalls,
} = {}) {
  if (!id) {
    throw new Error("feature enable needs <id>");
  }

  const result = setFeatureLevel(id, level, { homeDir, dryRun });
  const verb = dryRun ? "Would set" : "Set";

  print(`${verb} ${result.id}=${result.level} (was ${result.previous})`);

  if (dryRun || result.previous === result.level) {
    return result;
  }

  const refreshed = await refresh();

  if (refreshed) {
    print(`Re-applied ${refreshed.global} global host(s), ${refreshed.projects} project task(s).`);
  }

  return result;
}

/**
 * Disable a feature (level `off` when it exists).
 *
 * @param {{
 *   id: string,
 *   dryRun?: boolean,
 *   homeDir?: string,
 *   refresh?: () => Promise<{ global: number, projects: number }|void>|{ global: number, projects: number }|void,
 * }} options
 */
export async function featureDisableCommand({ id, dryRun = false, homeDir, refresh = refreshRememberedInstalls } = {}) {
  return featureEnableCommand({ id, level: "disable", dryRun, homeDir, refresh });
}

/** Current level helper for tests and the wizard. */
export function currentFeatureLevel(id, { homeDir } = {}) {
  return readLevel(id, mergedEnv({ homeDir, env: process.env }));
}
