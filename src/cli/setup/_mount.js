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

import { openScreen, rendererOptions } from "./opentui/_screen.js";
import { INSTALL_STEPS, runInstallWizard, runUninstallWizard, UNINSTALL_STEPS } from "./opentui/_wizard.js";

export { rendererOptions };

/**
 * Render one wizard full-screen and resolve with what it finished with.
 *
 * @param {{ direction?: "install"|"uninstall", defaults?: object }} options
 * @returns {Promise<{ results: object[], dryRun: boolean }|null>} null when the user quit
 */
export async function mountWizard({ direction = "install", defaults = {} } = {}) {
  const uninstall = direction === "uninstall";
  const screen = await openScreen({
    title: uninstall ? "Uninstall" : "Setup",
    subtitle: defaults.dryRun ? "dry run" : "",
    steps: uninstall ? UNINSTALL_STEPS : INSTALL_STEPS,
  });

  try {
    return uninstall ? await runUninstallWizard({ screen, defaults }) : await runInstallWizard({ screen, defaults });
  } finally {
    screen.close();
  }
}
