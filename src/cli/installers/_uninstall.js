/**
 * @module cli/installers/uninstall
 *
 * Re-exports the per-host uninstall bodies and builds `uninstallers` as a
 * lookup on the host record (`hostRecord(id).uninstall`).
 */

export * from "./_uninstall-hosts.js";
export * from "./_uninstall-clis.js";
export { uninstallOpencode } from "./_agents-opencode.js";

import { catalogHosts, hostRecord } from "./hosts/index.js";

const uninstallers = Object.fromEntries(catalogHosts().map((id) => [id, hostRecord(id).uninstall]));

export { uninstallers };
