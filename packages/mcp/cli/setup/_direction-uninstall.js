/** The uninstall direction, with or without a wizard. */

import { uninstallNextSteps } from "./_next-steps.js";
import { printSummary, runPlain } from "./_plain.js";
import { buildProjectUninstallPlan } from "./_plan-project.js";
import { buildUninstallPlan } from "./_plan-uninstall.js";
import { scanInstallation } from "./_scan.js";
import { settleExit } from "./_settle.js";

/** Run the uninstall direction, drawing the wizard when the caller asked for it. */
export async function uninstall(options) {
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
