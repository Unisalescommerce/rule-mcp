/**
@module cli/register-secrets

The `secrets` command declaration. The handler is imported inside the action,
so `--help` stays off the core/secrets import graph.
*/
/** Register the `secrets` command. */
export function registerSecretsCommand(program) {
  program
    .command("secrets")
    .description("Scan a patch for credentials with betterleaks (offline, redacted)")
    .option("--range <revspec>", "scan a revision range instead of the staged patch")
    .option("--repo <path>", "repository directory (default: cwd)")
    .option("--json", "print findings as JSON")
    .allowExcessArguments(false)
    .action(async (options) => {
      const { secretsCommand } = await import("./commands/_secrets.js");

      process.exitCode = secretsCommand({ range: options.range, repo: options.repo, json: options.json });
    });
}
