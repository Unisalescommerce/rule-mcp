/** The rules refresh `init` reports, and the failure it survives. */

import { refreshProjectRules } from "./installers/_rules-project.js";

/**
 * Refresh the project's rules block, and turn a failure into a report line.
 *
 * `init` prepares a project; a block it cannot refresh is a line in the report,
 * not a command that fails.
 *
 * @param {string} projectDir
 * @param {{ dryRun?: boolean }} [options]
 * @returns {Array<{ file: string, status: string }>}
 */
export function refreshProjectRulesSafely(projectDir, options = {}) {
  try {
    return refreshProjectRules(projectDir, { dryRun: Boolean(options.dryRun) });
  } catch (error) {
    return [{ file: projectDir, status: `failed: ${error.message}` }];
  }
}
