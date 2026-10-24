/** @module cli/install/hook-hosts - the hook mechanism each host documents */

/**
 * `mechanism` decides the writer: a native config file, an in-process plugin,
 * an extension module, or nothing at all.
 */
export const HOOK_HOSTS = {
  claude: { mechanism: "native", events: ["PreToolUse", "PostToolUse", "SessionStart"], reason: "Documented lifecycle hooks" },
  cursor: { mechanism: "native", events: ["preToolUse", "postToolUse"], reason: "hooks.json at project or user level" },
  gemini: { mechanism: "native", events: ["BeforeTool", "AfterTool"], reason: "Documented hooks with a JSON schema" },
  opencode: { mechanism: "plugin", events: ["tool.execute.before", "tool.execute.after"], reason: "In-process TS plugin in .opencode/plugins" },
  pi: { mechanism: "extension", events: ["tool_call", "tool_result"], reason: "Extension module calling pi.on in hooks/pre" },
  codex: { mechanism: "native", events: [], reason: "Lifecycle hooks documented; event names to confirm" },
  copilot: { mechanism: "none", events: [], reason: "Custom agents and instructions only, no tool hooks" },
  qwen: { mechanism: "extension", events: [], reason: "Commands, skills and extensions; no tool hook documented" },
  goose: { mechanism: "extension", events: [], reason: "MCP extensions; no tool hook documented" },
  aider: { mechanism: "none", events: [], reason: "No hooks or plugin system documented" },
  zed: { mechanism: "none", events: [], reason: "Lifecycle hooks are still a proposal, not shipped" },
  kiro: { mechanism: "native", events: ["preToolUse", "postToolUse", "agentSpawn", "userPromptSubmit", "stop"], reason: "Agent hooks in the agent configuration" },
};

/**
 * @param {string} agent
 * @returns {{ mechanism: string, events: string[], reason: string }}
 */
export function hookSupport(agent) {
  return HOOK_HOSTS[agent] ?? { mechanism: "none", events: [], reason: "Unknown host" };
}
