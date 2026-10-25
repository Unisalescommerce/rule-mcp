/** @module cli/install/detect - which agents are present on this machine */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { serverName, allAgents, HOME, vscodeGlobalDir } from "../installers/index.js";
import { GENERIC_HOSTS, hostPaths } from "../installers/_hosts.data.js";
import { emacsInitFile, nvimMcpFile } from "../installers/_agents-ide.js";

export * from "../installers/index.js";

/**
 * Detect which agents have rule-mcp configured.
 * Checks common config file locations for the MCP server entry.
 *
 * @returns {Array<{ name: string, configured: boolean, configFile: string|null }>}
 */
export function detectInstalledAgents() {
  const checks = [
    { name: "claude", path: join(HOME, ".claude.json"), key: serverName },
    { name: "codex", path: join(HOME, ".codex", "config.toml"), key: serverName },
    { name: "cursor", path: join(HOME, ".cursor", "mcp.json"), key: serverName },
    { name: "copilot", path: join(HOME, ".config", "github-copilot", "hosts.json"), key: `copilot-mcp-${serverName}` },
    { name: "gemini", path: join(HOME, ".gemini", "settings.json"), key: serverName },
    { name: "pi", path: join(HOME, ".pi", "agent", "mcp.json"), key: serverName },
    { name: "opencode", path: join(HOME, ".config", "opencode", "opencode.json"), key: serverName },
    { name: "vscode", path: join(vscodeGlobalDir(), "mcp.json"), key: serverName },
    { name: "jetbrains", path: join(process.cwd(), ".idea", "mcp.json"), key: serverName },
  ];

  return [
    ...checks,
    // Devin reads mcp_config.json, not the generic mcp.json.
    { name: "devin", paths: [join(HOME, ".config", "devin", "mcp_config.json")], key: serverName },
    // Neovim and Emacs keep their own file, written by their own installers.
    { name: "neovim", paths: [nvimMcpFile()], key: serverName },
    { name: "emacs", paths: [emacsInitFile()], key: serverName },
    // The generic hosts keep one row each, in the file they read today first and
    // the one an earlier release wrote second: an install that has not been
    // migrated is still found, and the row says which file answered.
    ...GENERIC_HOSTS.map((name) => ({ name, paths: hostPaths(name), key: serverName })),
  ].map(({ name, path, paths, key }) => {
    const candidates = paths ?? [path];
    const found = candidates.find((file) => existsSync(file) && readFileSync(file, "utf8").includes(key ?? serverName));

    return { name, configured: Boolean(found), configFile: found ?? (existsSync(candidates[0]) ? candidates[0] : null) };
  });
}

/**
 * Get all supported agent names.
 * @returns {string[]}
 */
export function getAllAgents() {
  return [...allAgents];
}
