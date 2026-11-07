/**
 * @module cli/setup/mount
 *
 * Putting a wizard on the alternate screen and taking it off again.
 *
 * The alternate screen is what makes this a viewport application instead of
 * scrollback: the frame owns the window while it runs, and the user's shell
 * history is exactly as they left it afterwards. The consequence is that
 * everything drawn is gone on exit, which is why the caller prints a plain
 * summary once the screen is restored.
 *
 * The renderer is opened once for the whole run. Every step mounts into the
 * same frame, so the rail, the title bar and the key bar never flicker, and a
 * process that dies inside the alternate screen cannot happen without the
 * `finally` below putting the cursor back.
 */

import { openScreen } from "./opentui/_screen.js";
import { createPlainScreen } from "./_screen-plain.js";
import { canRenderWizard } from "./_version-floor.js";
import { INSTALL_STEPS, runInstallWizard, runUninstallWizard, UNINSTALL_STEPS } from "./opentui/_wizard.js";
import { quietRendererWarnings } from "./_warnings.js";

// Installed before the first screen opens: the renderer's native core imports
// `node:ffi`, and its experimental notice would land after the screen closes.
quietRendererWarnings();

/**
 * Render one wizard full-screen and resolve with what it finished with.
 *
 * @param {{ direction?: "install"|"uninstall", defaults?: object }} options
 * @returns {Promise<{ results: object[], dryRun: boolean }|null>} null when the user quit
 */
export async function mountWizard({ direction = "install", defaults = {} } = {}) {
  const uninstall = direction === "uninstall";
  const title = uninstall ? "Uninstall" : "Setup";
  const steps = uninstall ? UNINSTALL_STEPS : INSTALL_STEPS;
  // The renderer needs `node:ffi`; the flow does not. A terminal without it
  // answers the same questions as prompts instead of drawing the frame.
  const screen = canRenderWizard() ? await openScreen({ title, subtitle: defaults.dryRun ? "dry run" : "", steps }) : createPlainScreen({ steps });

  try {
    return uninstall ? await runUninstallWizard({ screen, defaults }) : await runInstallWizard({ screen, defaults });
  } finally {
    screen.close();
  }
}

export { rendererOptions } from "./opentui/_screen.js";
