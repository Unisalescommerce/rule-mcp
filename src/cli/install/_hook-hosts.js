/** @module cli/install/hook-hosts - the hook mechanism each host documents */

/**
 * `mechanism` decides the writer: a native config file, an in-process plugin,
 * an extension module, or nothing at all. `file` is where a native host reads
 * its hooks; `writable` says the installer can write that file today.
 *
 * A host whose mechanism exists but has no installer target yet stays
 * `writable: false`, so the dimensions screen never offers a write it cannot
 * perform.
 */
export const HOOK_HOSTS = {
  claude: {
    mechanism: "native",
    writable: true,
    file: "~/.claude/settings.json",
    events: ["PreToolUse", "PostToolUse", "SessionStart", "UserPromptSubmit"],
    reason: "Documented lifecycle hooks",
  },
  cursor: {
    mechanism: "native",
    writable: true,
    file: "~/.cursor/hooks.json",
    events: ["preToolUse", "postToolUse", "sessionStart", "beforeSubmitPrompt"],
    reason: "hooks.json at project or user level",
  },
  gemini: { mechanism: "native", writable: true, file: "~/.gemini/settings.json", events: ["BeforeTool", "AfterTool"], reason: "Documented hooks with a JSON schema" },
  opencode: { mechanism: "plugin", writable: false, events: ["tool.execute.before", "tool.execute.after"], reason: "In-process TS plugin in .opencode/plugins" },
  pi: { mechanism: "extension", writable: false, events: ["tool_call", "tool_result"], reason: "Extension module calling pi.on in hooks/pre" },
  codex: {
    mechanism: "native",
    writable: true,
    file: "~/.codex/hooks.json",
    events: ["PreToolUse", "PostToolUse", "SessionStart", "UserPromptSubmit"],
    reason: "hooks.json or inline [hooks] in config.toml, trusted once with /hooks",
  },
  cline: { mechanism: "plugin", writable: false, events: ["beforeTool", "afterTool"], reason: "SDK AgentPlugin hooks, loaded from pluginPaths" },
  kilo: { mechanism: "plugin", writable: false, events: ["tool.execute.before", "tool.execute.after"], reason: "Plugin directory (~/.config/kilo/plugin) or plugin array" },
  copilot: { mechanism: "none", writable: false, events: [], reason: "Custom agents and instructions only, no tool hooks" },
  qwen: { mechanism: "extension", writable: false, events: [], reason: "Commands, skills and extensions; no tool hook documented" },
  goose: { mechanism: "extension", writable: false, events: [], reason: "MCP extensions; no tool hook documented" },
  aider: { mechanism: "none", writable: false, events: [], reason: "No hooks or plugin system documented" },
  roo: { mechanism: "none", writable: false, events: [], reason: "No tool hook documented: the extension exposes slash commands as prompt files in .roo/commands" },
  zed: { mechanism: "none", writable: false, events: [], reason: "Lifecycle hooks are still a proposal, not shipped" },
  kiro: {
    mechanism: "native",
    writable: true,
    file: "~/.kiro/hooks/rule-mcp.json",
    events: ["PreToolUse", "PostToolUse", "SessionStart", "UserPromptSubmit", "Stop"],
    reason: "Standalone JSON files in .kiro/hooks",
  },
  // The ten hosts below have no writable hook file. Each entry exists so the
  // wizard can say why instead of falling back to "Unknown host", which reads
  // as an oversight rather than a measured absence.
  droid: { mechanism: "none", writable: false, events: [], reason: "Hooks are managed inside the CLI with `/hooks`; no user-writable hook file is documented" },
  vscode: { mechanism: "none", writable: false, events: [], reason: "Copilot Chat sessions support lifecycle hooks, but no user-writable hook file is documented" },
  antigravity: {
    mechanism: "none",
    writable: false,
    events: [],
    reason: "MCP and Skills only; the legacy workflow system was retired on 2026-10-19 and no hook file replaced it",
  },
  jetbrains: { mechanism: "none", writable: false, events: [], reason: "Prompt Library and MCP only; the chat surface exposes no hook file" },
  neovim: { mechanism: "none", writable: false, events: [], reason: "No hook API is standard across the MCP plugins; the plugin owns whatever exists" },
  emacs: { mechanism: "none", writable: false, events: [], reason: "No hook API is standard across the MCP clients; the client owns whatever exists" },
  devin: { mechanism: "none", writable: false, events: [], reason: "Runs in its own workspace runtime; no local hook file is documented" },
  kimi: { mechanism: "none", writable: false, events: [], reason: "Skills and MCP only; no hook is documented" },
  vibe: { mechanism: "none", writable: false, events: [], reason: "Product identity unverified by the study, and no hook is documented" },
  grok: { mechanism: "none", writable: false, events: [], reason: "Product identity unverified by the study, and no hook is documented" },
};

/**
 * @param {string} agent
 * @returns {{ mechanism: string, writable: boolean, file?: string, events: string[], reason: string }}
 */
export function hookSupport(agent) {
  return HOOK_HOSTS[agent] ?? { mechanism: "none", writable: false, events: [], reason: "Unknown host" };
}
