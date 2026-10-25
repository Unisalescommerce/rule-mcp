/** @module cli/install/hook-hosts - the hook mechanism each host documents */

/**
 * `mechanism` decides the writer: a native config file, an in-process plugin,
 * an extension module, or nothing at all. `file` is where a native host reads
 * its hooks; it stays absent for the two hosts that load code instead.
 */
export const HOOK_HOSTS = {
  claude: { mechanism: "native", file: "~/.claude/settings.json", events: ["PreToolUse", "PostToolUse", "SessionStart", "UserPromptSubmit"], reason: "Documented lifecycle hooks" },
  cursor: {
    mechanism: "native",
    file: "~/.cursor/hooks.json",
    events: ["preToolUse", "postToolUse", "sessionStart", "beforeSubmitPrompt"],
    reason: "hooks.json at project or user level",
  },
  gemini: { mechanism: "native", file: "~/.gemini/settings.json", events: ["BeforeTool", "AfterTool"], reason: "Documented hooks with a JSON schema" },
  opencode: { mechanism: "plugin", events: ["tool.execute.before", "tool.execute.after"], reason: "In-process TS plugin in .opencode/plugins" },
  pi: { mechanism: "extension", events: ["tool_call", "tool_result"], reason: "Extension module calling pi.on in hooks/pre" },
  codex: {
    mechanism: "native",
    file: "~/.codex/hooks.json",
    events: ["PreToolUse", "PostToolUse", "SessionStart", "UserPromptSubmit"],
    reason: "hooks.json or inline [hooks] in config.toml, trusted once with /hooks",
  },
  copilot: { mechanism: "none", events: [], reason: "Custom agents and instructions only, no tool hooks" },
  qwen: { mechanism: "extension", events: [], reason: "Commands, skills and extensions; no tool hook documented" },
  goose: { mechanism: "extension", events: [], reason: "MCP extensions; no tool hook documented" },
  aider: { mechanism: "none", events: [], reason: "No hooks or plugin system documented" },
  zed: { mechanism: "none", events: [], reason: "Lifecycle hooks are still a proposal, not shipped" },
  kiro: {
    mechanism: "native",
    file: "~/.kiro/hooks/rule-mcp.json",
    events: ["PreToolUse", "PostToolUse", "SessionStart", "UserPromptSubmit", "Stop"],
    reason: "Standalone JSON files in .kiro/hooks",
  },
};

/**
 * @param {string} agent
 * @returns {{ mechanism: string, file?: string, events: string[], reason: string }}
 */
export function hookSupport(agent) {
  return HOOK_HOSTS[agent] ?? { mechanism: "none", events: [], reason: "Unknown host" };
}
