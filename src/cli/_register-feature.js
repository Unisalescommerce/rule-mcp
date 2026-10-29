/**
 * @module cli/register-feature
 *
 * `rule-mcp feature list | enable | disable`.
 */

import { Option } from "commander";

/** Register the `feature` command group. */
export function registerFeatureCommand(program) {
  const feature = program
    .command("feature")
    .description("List or change user-facing feature switches")
    .action(function featureAction(options, command) {
      command.outputHelp();
    });

  feature
    .command("list")
    .description("Show every feature and its current level")
    .allowExcessArguments(false)
    .action(async () => (await import("./commands/_feature.js")).featureListCommand());

  feature
    .command("enable")
    .description("Turn a feature on, or set an explicit level")
    .argument("<id>", "feature id (adr, telemetry, update, tokensave, minimal-tools)")
    .addOption(new Option("--level <name>", "level to set (default: the feature's non-off default)"))
    .option("--dry-run", "preview without writing or re-applying installs")
    .allowExcessArguments(false)
    .action(async (id, options) =>
      (await import("./commands/_feature.js")).featureEnableCommand({
        id,
        level: options.level ?? "enable",
        dryRun: Boolean(options.dryRun),
      }),
    );

  feature
    .command("disable")
    .description("Turn a feature off")
    .argument("<id>", "feature id")
    .option("--dry-run", "preview without writing or re-applying installs")
    .allowExcessArguments(false)
    .action(async (id, options) =>
      (await import("./commands/_feature.js")).featureDisableCommand({
        id,
        dryRun: Boolean(options.dryRun),
      }),
    );
}
