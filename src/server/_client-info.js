/**
@module server/client-info
 *
 * Remember which client connected, for the record a tool call writes.
 *
 * The handshake (`initialize`) is the only place the server learns the client's
 * name, and a tool call is the first request where its answer is certainly
 * available. A benchmark that cannot say which agent produced it is a benchmark
 * of nothing.
 */

import { setClientInfo } from "../core/telemetry/recorder/index.js";

/**
 * Store the client the handshake named.
 *
 * @param {object} server - anything that answers `getClientVersion`
 */
export function rememberClient(server) {
  setClientInfo(server.getClientVersion?.());
}
