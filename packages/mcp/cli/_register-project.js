/**
@module cli/register-project
 *
 * `rule-mcp project add|remove`: join or leave the set of projects this machine
 * configures. The store is `~/.rule-mcp/state/projects.json`, so the command is
 * the only place the membership is edited by hand.
 */

/** Register the `project` command group. */
export function registerProjectCommand(program) {
  const project = program
    .command("project")
    .description("Configure or take back a project-scope install")
    .action(function projectAction(options, command) {
      command.outputHelp();
    });

  project
    .command("add")
    .description("Configure a project from the last recorded one")
    .argument("[path]", "project root (default: the current directory)")
    .option("--agent <name>", "narrow to one agent (repeatable)", collect, [])
    .option("--project-config <kind>", "shared (portable) or local launcher")
    .option("--dry-run", "preview without writing")
    .option("--json", "print machine-readable JSON instead of the plan")
    .allowExcessArguments(false)
    .action(async (path, options) => {
      const { projectAdd } = await import("./commands/_project.js");

      await report(await projectAdd({ path, agents: options.agent, projectConfig: options.projectConfig, dryRun: options.dryRun }), options, "add");
    });

  project
    .command("remove")
    .description("Take back every config this project's install wrote")
    .argument("[path]", "project root (default: the current directory)")
    .option("--dry-run", "preview without removing")
    .option("--json", "print machine-readable JSON instead of the plan")
    .allowExcessArguments(false)
    .action(async (path, options) => {
      const { projectRemove } = await import("./commands/_project.js");

      await report(await projectRemove({ path, dryRun: options.dryRun }), options, "remove");
    });
}

/** Collector for repeatable options: `--agent a --agent b` -> ["a", "b"]. */
const collect = (value, previous) => [...previous, value];

/**
Print one run: the JSON result, or a line per task.

@param {{ root: string, dryRun: boolean, results: object[] }} outcome
@param {{ json?: boolean }} options
@param {"add"|"remove"} verb
*/
async function report(outcome, options, verb) {
  const { print, printJson } = await import("./commands/_shared.js");

  if (options.json) {
    printJson({ ...outcome, verb });

    return;
  }

  print(
    [
      `rule-mcp project ${verb}${outcome.dryRun ? " (dry run)" : ""} - ${outcome.root}`,
      "",
      ...outcome.results.map((task) => `  ${task.status === "ok" ? "✓" : "✗"} ${task.title} - ${task.summary}`),
    ].join("\n"),
  );
}
