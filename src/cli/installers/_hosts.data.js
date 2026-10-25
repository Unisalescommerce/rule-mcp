/**
 * @module cli/installers/hosts
 *
 * Where each generic host reads its MCP configuration, and in which dialect.
 *
 * One table, read by install, uninstall and detection, so the three cannot
 * disagree about a path. They disagreed before this existed: `antigravity` was
 * written to `~/.config/antigravity/mcp.json` and read from there, while the
 * host documents `~/.gemini/config/mcp_config.json`; `droid` was written to
 * `~/.config/factory/mcp.json` and removed from `~/.config/droid/mcp.json`, so
 * an uninstall left the entry behind.
 *
 * `format` is the dialect, not the vendor:
 *
 * - `mcpServers` - the shape most hosts read, `{ mcpServers: { <name>: {...} } }`
 * - `context_servers` - Zed, which nests `command` as a string beside `args`
 * - `opencode` - opencode's own schema: `mcp.<name>.command` already holds the
 *   arguments and the environment lives under `environment`
 * - `toml_array` - `[[mcp_servers]]` with a `name` key (Vibe)
 * - `toml_table` - `[mcp_servers.<name>]` (Grok)
 *
 * `legacy` lists what earlier releases wrote, kept for one reason: an uninstall
 * and a detection must find an old install, or a user is left with a config the
 * tool can no longer see. Nothing is written there any more, and a host may have
 * more than one: the generic writer used `~/.config/<name>/mcp.json` while the
 * droid installer override used `~/.config/factory/mcp.json`, and both exist.
 *
 * `evidence` carries what the 2026-10-25 study concluded about the product
 * itself. `ambiguous` means the vendor name does not identify one client: the
 * path below is the one a sibling project shipped, it is not verified here, and
 * the row says so instead of implying a test that never ran.
 */

import { homedir } from "node:os";
import { join } from "node:path";

/** Resolve a path that may start with `~` or `%APPDATA%`, at call time. */
function resolvePath(file) {
  const home = homedir();

  if (file.startsWith("~/")) {
    return join(home, file.slice(2));
  }

  if (file.startsWith("%APPDATA%/")) {
    return join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), file.slice("%APPDATA%/".length));
  }

  return file;
}

/**
 * The generic hosts: the ones whose config is a file at a documented path with no
 * dedicated installer. Claude, Codex, Cursor, Copilot, Gemini, Pi, opencode,
 * VS Code, JetBrains, Neovim, Emacs and Devin have their own installers.
 */
export const HOST_FILES = {
  cline: {
    file: "~/.cline/data/settings/cline_mcp_settings.json",
    format: "mcpServers",
    legacy: ["~/.config/cline/mcp.json"],
    evidence: "confirmed",
  },
  roo: { file: "~/.config/roo/mcp.json", format: "mcpServers", evidence: "confirmed" },
  zed: {
    file: "~/.config/zed/settings.json",
    windows: "%APPDATA%/Zed/settings.json",
    format: "context_servers",
    legacy: ["~/.config/zed/mcp.json"],
    evidence: "confirmed",
  },
  antigravity: {
    file: "~/.gemini/config/mcp_config.json",
    format: "mcpServers",
    legacy: ["~/.config/antigravity/mcp.json"],
    evidence: "migration",
  },
  kilo: { file: "~/.config/kilo/kilo.json", format: "opencode", legacy: ["~/.config/kilo/mcp.json"], evidence: "partial" },
  kimi: { file: "~/.kimi-code/mcp.json", format: "mcpServers", legacy: ["~/.config/kimi/mcp.json"], evidence: "partial" },
  vibe: { file: "~/.vibe/config.toml", format: "toml_array", legacy: ["~/.config/vibe/mcp.json"], evidence: "ambiguous" },
  grok: { file: "~/.grok/config.toml", format: "toml_table", legacy: ["~/.config/grok/mcp.json"], evidence: "ambiguous" },
  droid: { file: "~/.factory/mcp.json", format: "mcpServers", legacy: ["~/.config/droid/mcp.json", "~/.config/factory/mcp.json"], evidence: "confirmed" },
  kiro: { file: "~/.kiro/settings/mcp.json", format: "mcpServers", legacy: ["~/.config/kiro/mcp.json"], evidence: "needs-test" },
  qwen: { file: "~/.qwen/settings.json", format: "mcpServers", legacy: ["~/.config/qwen/mcp.json"], evidence: "confirmed" },
};

/** The generic host ids, in table order. */
export const GENERIC_HOSTS = Object.keys(HOST_FILES);

/**
 * The file a generic host reads today.
 *
 * @param {string} id
 * @returns {string|null}
 */
export function hostFile(id) {
  const row = HOST_FILES[id];

  if (!row) {
    return null;
  }

  return resolvePath(process.platform === "win32" && row.windows ? row.windows : row.file);
}

/**
 * The file an earlier release wrote, or null when there never was one.
 *
 * @param {string} id
 * @returns {string|null}
 */
export function legacyFile(id) {
  const first = HOST_FILES[id]?.legacy?.[0];

  return first ? resolvePath(first) : null;
}

/**
 * Every path a host may hold an entry in: where it is written now, then where it
 * used to be.
 *
 * @param {string} id
 * @returns {string[]}
 */
export function hostPaths(id) {
  const row = HOST_FILES[id];

  if (!row) {
    return [];
  }

  return [resolvePath(row.file), ...(row.legacy ?? []).map(resolvePath)];
}
