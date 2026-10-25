/**
 * @module cli/installers/hosts
 *
 * One record per catalog agent: the surface it is, the evidence behind it, and
 * the file its MCP entry lives in.
 *
 * Four registries grew independently - the agent catalog, the command targets,
 * the command gaps and the hook hosts - and each could name a host the others had
 * never heard of. This module is the place where a host is a host: `hostRecord`
 * answers for all 23, and `tests/installers/host-record.test.mjs` fails when the
 * four registries disagree about one.
 *
 * What lives here is the declaration, not the behaviour. `install` and
 * `uninstall` stay in `_registry.js` and `_uninstall.js` for now: Phase 1 of
 * `docs/plans/mcp-host-integration-depth.md` is "no behaviour change", and
 * rewriting 23 writer bodies to move them would be a large diff with no
 * observable difference. Their bodies move in Phase 2, one host at a time, as
 * each one is touched. The same reason means one module per host is deferred:
 * ADR 061 asks for one file per concern, and 23 files of the same twelve lines
 * are one concern wearing 23 names.
 *
 * `server.file` is the file an install writes today. `legacy` lists the files
 * earlier releases wrote, so an uninstall and a detection still find an old
 * install. A host that never moved has an empty list.
 */

import { join } from "node:path";

import { HOME, serverName } from "../_paths.js";
import { devinConfigPath, emacsInitFile, nvimMcpFile, vscodeGlobalDir } from "../_agents-ide.js";
import { GENERIC_HOSTS, hostFile, hostPaths } from "../_hosts.data.js";

import { evidenceOf } from "./_evidence.data.js";

/** The hosts whose config is not a table row: each has its own installer. */
const DEDICATED = {
  claude: () => ({ server: { file: join(HOME, ".claude.json") } }),
  codex: () => ({ server: { file: join(HOME, ".codex", "config.toml") } }),
  cursor: () => ({ server: { file: join(HOME, ".cursor", "mcp.json") } }),
  copilot: () => ({
    server: { file: join(HOME, ".copilot", "mcp-config.json") },
    legacy: [join(HOME, ".config", "github-copilot", "hosts.json")],
  }),
  gemini: () => ({ server: { file: join(HOME, ".gemini", "settings.json") } }),
  pi: () => ({ server: { file: join(process.env.PI_CODING_AGENT_DIR ?? join(HOME, ".pi", "agent"), "mcp.json") } }),
  opencode: () => ({ server: { file: join(HOME, ".config", "opencode", "opencode.json") } }),
  vscode: () => ({ server: { file: join(vscodeGlobalDir(), "mcp.json") } }),
  // The port plan moves this to Junie's documented file; until then the tree
  // writes what it has always written and the record says so.
  jetbrains: () => ({ server: { file: join(process.cwd(), ".idea", "mcp.json") } }),
  neovim: () => ({ server: { file: nvimMcpFile() } }),
  emacs: () => ({ server: { file: emacsInitFile() } }),
  devin: () => ({ server: { file: devinConfigPath() } }),
};

/**
 * The record for one host, or null when the catalog does not know it.
 *
 * @param {string} id
 * @returns {{ id: string, label: string, kind: string, evidence: string, server: { file: string }, legacy: string[], key: string }|null}
 */
export function hostRecord(id) {
  const evidence = evidenceOf(id);

  if (!evidence || !evidence.installer) {
    return null;
  }

  const dedicated = DEDICATED[id]?.();

  if (dedicated) {
    return { id, label: evidence.label, kind: evidence.kind, evidence: evidence.status, key: serverName, legacy: [], ...dedicated };
  }

  return {
    id,
    label: evidence.label,
    kind: evidence.kind,
    evidence: evidence.status,
    server: { file: hostFile(id) },
    legacy: hostPaths(id).slice(1),
    key: serverName,
  };
}

/** Every host the catalog knows, in catalog order. */
export function catalogHosts() {
  return [...GENERIC_HOSTS, ...Object.keys(DEDICATED)];
}

/**
 * Every file a host may hold an entry in: the one it reads today, then the ones
 * earlier releases wrote.
 *
 * @param {string} id
 * @returns {string[]}
 */
export function serverPaths(id) {
  const record = hostRecord(id);

  return record ? [record.server.file, ...record.legacy] : [];
}

/** The label a report uses, or the id when the catalog does not know the host. */
export function hostLabel(id) {
  return hostRecord(id)?.label ?? id;
}
