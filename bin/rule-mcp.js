#!/usr/bin/env node

/**
 * @module bin/rule
 *
 * CLI entry point for rule-mcp.
 * Delegates to the cli() function in packages/mcp/index.js.
 *
 * Usage: rule-mcp [command] [options]
 *   See `rule-mcp help` for full usage.
 *
 * The compiled code cache is turned on before the application graph is loaded,
 * and the load is a dynamic import for that reason: a static import is hoisted
 * above every statement here, so the modules would be compiled before the
 * cache existed. stdio spawns this process per client, so every module it
 * parses is parsed again on the next connect.
 *
 * `NODE_COMPILE_CACHE=<dir>` picks the directory; `NODE_DISABLE_COMPILE_CACHE=1`
 * turns it off, which is what CI and the test suites use so a run never depends
 * on a cache another run wrote.
 *
 * The `@mcp/*` resolve hook is registered here for the same reason, and not in
 * the shebang: a shebang takes one argument on Linux, so `node --import ...`
 * there would be passed as a single unknown flag. Every other entry point that
 * loads server code registers it too - see `scripts/alias-hook.mjs`.
 *
 * @see https://nodejs.org/api/module.html#moduleenablecompilecachecachedir
 */

await import("../scripts/alias-hook.mjs");

try {
  const { enableCompileCache } = await import("node:module");

  // Added in Node 22.1; the engines field allows 20, where this is a no-op.
  enableCompileCache?.();
} catch {
  /* a cache is an optimization, never a reason to fail to start */
}

/**
 * `guard --send` talks to the warm daemon and must not load Commander or the
 * skill catalog: the spawn spike showed a full CLI `--send` costs the same as
 * `guard` itself, while importing only `_send.js` is ~spawn + 30 ms.
 *
 * @param {string[]} argv
 * @returns {boolean}
 */
const isGuardSend = (argv) => argv[0] === "guard" && argv.includes("--send");

/**
 * @param {string[]} argv
 * @returns {string}
 */
const guardSendAction = (argv) => {
  const positional = argv.slice(1).find((part) => part !== "--send" && !part.startsWith("-"));

  return positional ?? "bash";
};

const argv = process.argv.slice(2);

if (isGuardSend(argv)) {
  try {
    const { runGuardSend } = await import("../packages/mcp/cli/guard/_send.js");

    await runGuardSend(guardSendAction(argv));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
} else {
  const { cli } = await import("../packages/mcp/index.js");

  cli();
}
