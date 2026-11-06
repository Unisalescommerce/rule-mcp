/**
 * @module cli/installers/hosts
 *
 * One record per catalog agent: the surface it is, the evidence behind it, and
 * the file its MCP entry lives in.
 *
 * Four registries grew independently - the agent catalog, the command targets,
 * the command gaps and the hook hosts - and each could name a host the others had
 * never heard of. This module is the place where a host is a host: `hostRecord`
 * answers for all 23, and `scripts/__tests__/installers/host-record.test.mjs` fails when the
 * four registries disagree about one.
 *
 * Path and identity live in `./_core.js` so uninstall bodies can read them
 * without importing `./_writers.js`. `install` / `uninstall` are attached here
 * from the writers table; bodies stay in `_agents-*.js` / `_uninstall-*.js`.
 * One module per host remains deferred: ADR 053 asks for one file per concern,
 * and 23 files of the same twelve lines are one concern wearing 23 names.
 *
 * `server.file` is the file an install writes today. `legacy` lists the files
 * earlier releases wrote, so an uninstall and a detection still find an old
 * install. A host that never moved has an empty list.
 */

import { hostRecord as hostRecordCore, catalogHosts, serverPaths, levelSupport, hostLabel } from "./_core.js";
import { writerPair } from "./_writers.js";

/**
 * The record for one host, or null when the catalog does not know it.
 *
 * @param {string} id
 * @returns {{ id: string, label: string, kind: string, evidence: string, server: { file: string }, legacy: string[], key: string, levels: object, ceiling: string, install: Function, uninstall: Function }|null}
 */
export function hostRecord(id) {
  const core = hostRecordCore(id);

  if (!core) {
    return null;
  }

  const writers = writerPair(id);

  if (!writers) {
    return null;
  }

  return { ...core, install: writers.install, uninstall: writers.uninstall };
}

export { catalogHosts, serverPaths, levelSupport, hostLabel };
