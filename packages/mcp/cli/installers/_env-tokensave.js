/** The tokensave switch a project-scope install derives, and the cleanup of the constant an older install wrote. */

import { hasTokensave } from "../../core/detector/index.js";
import { DEFAULT_OPTOUT_ENV, readEnvConfig } from "./_env.js";

/**
What every install wrote before the tokensave default became derived: the
constant table, including `RULE_MCP_NO_TOKENSAVE: "0"`. Kept so those files can
be told apart from a decision.
*/
const HISTORICAL_OPTOUT_ENV = { ...DEFAULT_OPTOUT_ENV, RULE_MCP_NO_TOKENSAVE: "0" };

/**
Drop the tokensave key from a file that is exactly the defaults an earlier
install wrote.

`0` means "on, chosen" now, so the value those installs wrote would outrank the
derived default forever. A file that matches the written table key for key
carries no decision - only the ones the installer made - and is cleaned once so
the project can decide again. Anything a user edited, or a chosen `1`, is left
untouched.

@param {Record<string, string>} saved
@returns {Record<string, string>}
*/
export function pruneHistoricalTokensaveDefault(saved) {
  if (saved.RULE_MCP_NO_TOKENSAVE !== "0") {
    return saved;
  }

  const keys = Object.keys(saved);
  const writtenByInstall = keys.length === Object.keys(HISTORICAL_OPTOUT_ENV).length && keys.every((key) => HISTORICAL_OPTOUT_ENV[key] === saved[key]);

  if (!writtenByInstall) {
    return saved;
  }

  const rest = { ...saved };
  delete rest.RULE_MCP_NO_TOKENSAVE;

  return rest;
}

/**
 * The tokensave switch a project-scope install should carry.
 *
 * Every other opt-out is a constant, because whether the feature applies never
 * depended on the project. Tokensave does: awareness with no code graph has
 * nothing to read, so a project without `.tokensave/` installs `off`, and one
 * with a graph is left unpinned so the runtime default applies. A choice the
 * user already recorded wins over both - the guess must not flip a decision.
 *
 * @param {string} projectDir
 * @returns {Record<string, string>}
 */
export function tokensaveProjectEnv(projectDir) {
  const saved = readEnvConfig();
  // Any recorded value is a decision now that `on` writes "0": off, autotrack,
  // and on are all visible, and only a file that records none of them lets the
  // project decide.
  const chosen = saved.RULE_MCP_NO_TOKENSAVE !== undefined || saved.RULE_MCP_TOKENSAVE_AUTOTRACK !== undefined;

  if (chosen) {
    return {};
  }

  return hasTokensave(projectDir) ? {} : { RULE_MCP_NO_TOKENSAVE: "1" };
}
