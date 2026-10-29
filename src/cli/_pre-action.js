/**
@module cli/pre-action
 *
 * The one hook every command runs before its action: register the core tools
 * the invocation path itself depends on.
 *
 * `guard` answers host hooks and never calls those tools, so bootstrapping them
 * on every hook spawn was pure wall time (Phase 5 spawn spike).
 */


/**
Whether this command needs the gateway/apply tools registered before it runs.

`guard` answers host hooks and never calls those tools. Bootstrapping them on
every hook spawn was pure wall time (Phase 5 spawn spike).

@param {{ name?: () => string } | undefined} actionCommand - Commander action command
@returns {boolean}
*/
export function shouldBootstrapCoreTools(actionCommand) {
  return actionCommand?.name?.() !== "guard";
}

/**
Install the hook on a commander program.

A hook rather than a top-level import, so `--help` and `--version` stay off
the tool import graph.

@param {import("commander").Command} program
*/
export function installPreActionHook(program) {
  program.hook("preAction", async (_thisCommand, actionCommand) => {
    if (!shouldBootstrapCoreTools(actionCommand)) {
      return;
    }

    const { bootstrapCoreTools } = await import("../tools/_bootstrap.js");

    await bootstrapCoreTools();
  });
}
