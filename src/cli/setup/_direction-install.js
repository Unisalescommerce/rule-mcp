/** The install direction, with or without a wizard. */

import { installNextSteps } from "./_next-steps.js";
import { printSummary, runPlain } from "./_plain.js";
import { buildInstallPlan } from "./_plan-install.js";
import { buildProjectInstallPlan, buildProjectRefreshPlan } from "./_plan-project.js";
import { preflight } from "./_preflight.js";
import { settleExit } from "./_settle.js";
import { detectInstalledAgents } from "../install/index.js";

/**
 * Run the install direction, drawing the wizard when the caller asked for it.
 */
export async function install(options) {
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
    features: options.features,
    adrPolicy: options.adrPolicy,
    attribution: options.attribution,
    attributionAgents: options.attributionAgents,
  });
  const { counts } = await runPlain({
    plan,
    dryRun: options.dryRun,
    title: "rule-mcp setup",
    nextSteps: installNextSteps({ mode: options.mode, dryRun: options.dryRun }),
  });

  settleExit(counts);
}
