/**
@module cli/register-check

The `check` command declaration. The handler is imported inside the action,
so `--help` stays off the guardrail engine's import graph.
*/
/** Register the `check` command. */
export function registerCheckCommand(program) {
  program
    .command("check")
    .description("Run the guardrails on changed, staged or named files (exit 1 on a block finding)")
    .option("--changed", "files changed since the merge base with --base, plus untracked files")
    .option("--staged", "the staged files, read from the index")
    .option("--files <list>", "comma-separated files, relative to the project root")
    .option("--base <ref>", "with --changed: the ref to compare against (default: HEAD)")
    .option("--json", "print findings as a JSON array")
    .option("--dir <path>", "project root (default: .)", ".")
    .allowExcessArguments(false)
    .action(async (options) => {
      const { checkCommand } = await import("./commands/_check.js");

      process.exitCode = await checkCommand(options);
    });
}
