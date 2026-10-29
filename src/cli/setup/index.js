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

import { install as runInstall } from "./_direction-install.js";
import { uninstall as runUninstall } from "./_direction-uninstall.js";
import { resolveSetupOptions, wizardRuntimeNote } from "./_options.js";

export { agentCatalog, agentRows } from "./_agent-rows.js";
export * from "./_entry.js";
export * from "./_options.js";
export * from "./_plan-install.js";
export * from "./_plan-project.js";
export * from "./_plan-uninstall.js";
export * from "./_preflight.js";
export * from "./_scan.js";
export * from "./_scan-skills.js";

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

  await (options.uninstall ? runUninstall(resolved) : runInstall(resolved));
}
