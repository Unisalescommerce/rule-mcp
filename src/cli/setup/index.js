/**
 * src/cli/setup: the install and uninstall wizard.
 *
 * One entry point for both directions. `runSetup` decides whether this
 * terminal can host the full-screen wizard and falls back to the plain
 * runner when it cannot. The shell and PowerShell scripts are bootstraps
 * that check node and call in here (ADR 090).
 *
 * The split inside this folder is deliberate. `_options`, `_plan-*`,
 * `_preflight`, `_scan` and `_run-plan` are pure or read-only and hold the
 * whole flow, which is why the installer can be tested without a terminal;
 * `opentui/` is the only folder that knows a renderer exists, and it is
 * imported lazily so a `--help` or a piped install never loads the native
 * core it will not draw with.
 */

import { installNextSteps, uninstallNextSteps } from "./_next-steps.js";
import { printSummary, runPlain } from "./_plain.js";
import { buildInstallPlan } from "./_plan-install.js";
import { buildProjectInstallPlan, buildProjectRefreshPlan, buildProjectUninstallPlan } from "./_plan-project.js";
import { buildUninstallPlan } from "./_plan-uninstall.js";
import { preflight } from "./_preflight.js";
import { resolveSetupOptions, wizardRuntimeNote } from "./_options.js";
import { scanInstallation } from "./_scan.js";
import { detectInstalledAgents } from "../install/index.js";

export { agentCatalog, agentRows } from "./_agent-rows.js";
export * from "./_entry.js";
export * from "./_options.js";
export * from "./_plan-install.js";
export * from "./_plan-project.js";
export * from "./_plan-uninstall.js";
export * from "./_preflight.js";
export * from "./_scan.js";
export * from "./_scan-skills.js";

/** Non-zero exit when any task failed, so CI notices. */
const settleExit = (counts) => {
  if (counts.fail > 0) {
    process.exitCode = 1;
  }
};

/** The install direction, with or without a wizard. */
async function install(options) {
  const { context } = preflight();

  if (context.blocked) {
    process.stderr.write("Preflight failed - run `rule-mcp doctor` for details.\n");
    process.exitCode = 1;

    return;
  }

  // Refresh walks `projects.json` and never opens the wizard: the store is the
  // source of truth for which roots to rewrite.
  if (options.refreshProjects) {
    const { counts } = await runPlain({
      plan: buildProjectRefreshPlan(),
      dryRun: options.dryRun,
      title: "rule-mcp setup --refresh-projects",
      nextSteps: installNextSteps({ mode: "stdio", dryRun: options.dryRun }),
    });

    settleExit(counts);

    return;
  }

  // Project-scope installs are flag-driven in this slice; wizard Scope UI is
  // a later step on the installer-scope plan.
  if (options.scope === "project") {
    if (options.interactive) {
      process.stdout.write("Project-scope setup uses flags in this release: pass --no-wizard with --scope project --project <path>.\n");
    }

    const agents =
      options.agents ??
      detectInstalledAgents()
        .filter((agent) => agent.configFile)
        .map((agent) => agent.name);
    const plan = buildProjectInstallPlan({
      agents,
      projects: options.projects,
      projectConfig: options.projectConfig,
    });
    const { counts } = await runPlain({
      plan,
      dryRun: options.dryRun,
      title: "rule-mcp setup --scope project",
      nextSteps: installNextSteps({ mode: "stdio", dryRun: options.dryRun }),
    });

    settleExit(counts);

    return;
  }

  if (options.interactive) {
    const { mountWizard } = await import("./_mount.js");
    const outcome = await mountWizard({ direction: "install", defaults: options });

    if (!outcome) {
      process.stdout.write("Canceled - nothing was written.\n");

      return;
    }

    settleExit(
      printSummary({
        ...outcome,
        title: "rule-mcp setup",
        nextSteps: installNextSteps({ mode: options.mode, dryRun: outcome.dryRun }),
      }),
    );

    return;
  }

  const agents =
    options.agents ??
    detectInstalledAgents()
      .filter((agent) => agent.configFile)
      .map((agent) => agent.name);
  const plan = buildInstallPlan({
    agents,
    mode: options.mode,
    extras: Object.fromEntries(options.extras.map((id) => [id, true])),
    force: options.force,
    context,
    selection: options.selection,
    minimal: options.minimal,
    surface: options.surface,
  });
  const { counts } = await runPlain({
    plan,
    dryRun: options.dryRun,
    title: "rule-mcp setup",
    nextSteps: installNextSteps({ mode: options.mode, dryRun: options.dryRun }),
  });

  settleExit(counts);
}

/** The uninstall direction, with or without a wizard. */
async function uninstall(options) {
  if (options.interactive) {
    const { mountWizard } = await import("./_mount.js");
    const outcome = await mountWizard({ direction: "uninstall", defaults: options });

    if (!outcome) {
      process.stdout.write("Canceled - nothing was removed.\n");

      return;
    }

    settleExit(
      printSummary({
        ...outcome,
        title: "rule-mcp uninstall",
        nextSteps: uninstallNextSteps({ dryRun: outcome.dryRun, purged: options.purge }),
      }),
    );

    return;
  }

  const scan = scanInstallation();
  const groups = scan.groups.filter((group) => group.count > 0).map((group) => group.id);
  const purgeIds = options.purge && !options.keepConfig ? scan.purge.map((target) => target.id) : [];
  // Project installs are recorded separately from the global manifest; walk
  // them first so uninstall reverses every tree `setup --scope project` wrote.
  const plan = [...buildProjectUninstallPlan(), ...buildUninstallPlan({ agents: options.agents ?? scan.agents, groups, purgeIds })];
  const { counts } = await runPlain({
    plan,
    dryRun: options.dryRun,
    title: "rule-mcp uninstall",
    nextSteps: uninstallNextSteps({ dryRun: options.dryRun, purged: purgeIds.length > 0 }),
  });

  settleExit(counts);
}

/**
 * Run the wizard.
 *
 * @param {object} options - the parsed command-line options
 */
export async function runSetup(options = {}) {
  const resolved = resolveSetupOptions(options);
  // A wizard that was asked for and cannot be drawn says so once. Falling back
  // silently reads as the flag path having been chosen, which nobody chose.
  const note = resolved.interactive ? "" : wizardRuntimeNote();

  if (note && options.interactive !== false) {
    process.stdout.write(`${note}\n`);
  }

  await (options.uninstall ? uninstall(resolved) : install(resolved));
}
