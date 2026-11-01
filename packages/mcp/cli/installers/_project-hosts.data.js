/**
 * @module cli/installers/project-hosts
 *
 * Where each host reads a project-level MCP config. Separate from the user-level
 * table in `_hosts.data.js`: a project install must never invent a home path,
 * and a global install must never invent a project path.
 *
 * `file` is relative to the project root. `local`, when present, is either also
 * relative (beside the shared file) or a home path starting with `~/` (Claude's
 * project entry lives in `~/.claude.json`). A host with no `local` rejects
 * `--project-config local`.
 *
 * Hosts with no documented project file are listed in `NO_PROJECT_HOSTS` so the
 * gap is visible instead of implied.
 */

import { homedir } from "node:os";
import { join } from "node:path";

/** Resolve a project-relative or `~/` path against a project root. */
function resolveProjectPath(file, projectRoot) {
  if (file.startsWith("~/")) {
    return join(homedir(), file.slice(2));
  }

  return join(projectRoot, ...file.split("/"));
}

/**
 * Project-scope host rows. `format` matches `_host-formats.js` dialects, plus
 * `servers` for VS Code's project `mcp.json`.
 */
export const PROJECT_HOSTS = {
  claude: { file: ".mcp.json", format: "mcpServers", local: "~/.claude.json" },
  copilot: { file: ".mcp.json", format: "mcpServers" },
  pi: { file: ".mcp.json", format: "mcpServers" },
  codex: { file: ".codex/config.toml", format: "toml_table" },
  cursor: { file: ".cursor/mcp.json", format: "mcpServers" },
  vscode: { file: ".vscode/mcp.json", format: "servers" },
  gemini: { file: ".gemini/settings.json", format: "mcpServers" },
  qwen: { file: ".qwen/settings.json", format: "mcpServers" },
  roo: { file: ".roo/mcp.json", format: "mcpServers" },
  kiro: { file: ".kiro/settings/mcp.json", format: "mcpServers" },
  droid: { file: ".factory/mcp.json", format: "mcpServers" },
  devin: { file: ".devin/mcp_config.json", format: "mcpServers", local: ".devin/mcp_config.local.json" },
  kimi: { file: ".kimi-code/mcp.json", format: "mcpServers" },
  vibe: { file: ".vibe/config.toml", format: "toml_array" },
  grok: { file: ".grok/config.toml", format: "toml_table" },
  opencode: { file: "opencode.json", format: "opencode" },
  zed: { file: ".zed/settings.json", format: "context_servers" },
  jetbrains: { file: ".junie/mcp/mcp.json", format: "mcpServers" },
};

/** Host ids that have a project config row, in table order. */
export const PROJECT_HOST_IDS = Object.keys(PROJECT_HOSTS);

/** Catalog hosts with no documented project MCP file. */
export const NO_PROJECT_HOSTS = ["cline", "antigravity", "neovim", "emacs"];

/**
 * Absolute path of a host's shared project config, or null when the host has none.
 *
 * @param {string} id
 * @param {string} projectRoot
 * @returns {string|null}
 */
export function projectHostFile(id, projectRoot) {
  const row = PROJECT_HOSTS[id];

  return row ? resolveProjectPath(row.file, projectRoot) : null;
}

/**
 * Absolute path of a host's local (private) project config, or null when absent.
 *
 * @param {string} id
 * @param {string} projectRoot
 * @returns {string|null}
 */
export function projectHostLocalFile(id, projectRoot) {
  const row = PROJECT_HOSTS[id];

  return row?.local ? resolveProjectPath(row.local, projectRoot) : null;
}

/**
 * Dialect for a project host, or null when the host has no project row.
 *
 * @param {string} id
 * @returns {string|null}
 */
export function projectHostFormat(id) {
  return PROJECT_HOSTS[id]?.format ?? null;
}
