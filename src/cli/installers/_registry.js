/**
 * Installer registry: maps agent id -> install implementation via the host
 * record, plus the deprecated-name redirect table.
 * @module cli/installers/registry
 */

import { catalogHosts, hostRecord } from "./hosts/index.js";

const deprecatedAgents = new Map([["windsurf", "devin"]]);

const installers = Object.fromEntries(catalogHosts().map((id) => [id, hostRecord(id).install]));

export { deprecatedAgents, installers };
