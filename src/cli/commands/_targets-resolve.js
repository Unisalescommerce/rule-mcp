/** Which command targets a run resolves to, before anything is written. */

import { resolveCommandTargets } from "../../core/agents/command-targets/index.js";

/**
 * The targets a run resolves to: one agent when asked, otherwise what detection
 * found, and the legacy paths when the caller includes them.
 *
 * @param {{ agent?: string, includeLegacy?: boolean }} opts
 * @returns {Array<object>}
 */
export function resolvedTargets(opts) {
  const filter = opts.agent ? { agent: opts.agent } : { detectedOnly: true };

  return resolveCommandTargets({ ...filter, includeLegacy: Boolean(opts.includeLegacy) });
}
