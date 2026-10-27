/**
 * @module cli/guard/socket
 *
 * Path for the persistent guard daemon socket. Lives under the mutable state
 * dir so RULE_MCP_HOME / RULE_MCP_STATE_DIR relocate it with the rest of state.
 */

import { join } from "node:path";

import { getRuntimePaths } from "../paths/_runtime.js";

/**
 * Absolute path of the guard Unix socket.
 *
 * @returns {string}
 */
export function guardSocketPath() {
  return join(getRuntimePaths().stateDir, "guard.sock");
}
