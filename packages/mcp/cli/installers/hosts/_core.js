/**
 * @module cli/installers/hosts/core
 *
 * Path and identity for every catalog host, without install/uninstall writers.
 * Uninstall bodies import this module so they never close a cycle through
 * `hosts/_writers.js` (which must import those same bodies).
 */

import { join } from "node:path";

import { HOME, serverName } from "../_paths.js";
import { devinConfigPath, emacsInitFile, junieConfigPath, nvimMcpFile, vscodeGlobalDir } from "../_agents-ide.js";
import { ceilingOf, levelsOf } from "./_levels.js";
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
  jetbrains: () => ({ server: { file: junieConfigPath() } }),
  neovim: () => ({ server: { file: nvimMcpFile() } }),
  emacs: () => ({ server: { file: emacsInitFile() } }),
  devin: () => ({ server: { file: devinConfigPath() } }),
};

/**
 * The path/identity record for one host, or null when the catalog does not know it.
 *
 * @param {string} id
 * @returns {{ id: string, label: string, kind: string, evidence: string, server: { file: string }, legacy: string[], key: string, levels: object, ceiling: string }|null}
 */
export function hostRecord(id) {
  const evidence = evidenceOf(id);

  if (!evidence || !evidence.installer) {
    return null;
  }

  const levels = levelsOf(id);
  const identity = { id, label: evidence.label, kind: evidence.kind, evidence: evidence.status, key: serverName, levels, ceiling: ceilingOf(levels) };
  const dedicated = DEDICATED[id]?.();

  if (dedicated) {
    return { ...identity, legacy: [], ...dedicated };
  }

  return { ...identity, server: { file: hostFile(id) }, legacy: hostPaths(id).slice(1) };
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

/**
 * Whether a host can be installed at a level, and what it would be missing.
 *
 * @param {string} id
 * @param {string} level one of L0..L4
 * @returns {{ id: string, level: string, ceiling: string, allowed: boolean, missing: Array<{ rung: string, reason: string }> }|null}
 */
export function levelSupport(id, level) {
  const record = hostRecord(id);

  if (!record) {
    return null;
  }

  const asked = Number(level.replace(/^L/u, ""));

  if (Number.isNaN(asked) || asked < 0 || asked > 4) {
    return null;
  }

  const missing = Object.entries(record.levels)
    .filter(([rung, support]) => !support.supported && Number(rung.slice(1)) <= asked)
    .map(([rung, support]) => ({ rung, reason: support.reason }));

  return {
    id,
    level: `L${asked}`,
    ceiling: record.ceiling,
    allowed: asked <= Number(record.ceiling.slice(1)),
    missing,
  };
}

/** The label a report uses, or the id when the catalog does not know the host. */
export function hostLabel(id) {
  return hostRecord(id)?.label ?? id;
}
