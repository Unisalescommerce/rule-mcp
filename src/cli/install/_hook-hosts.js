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
  codex: { mechanism: "none", events: [], reason: "No user-facing hook mechanism" },
  copilot: { mechanism: "none", events: [], reason: "No documented hook mechanism" },
};

/**
 * @param {string} agent
 * @returns {{ mechanism: string, events: string[], reason: string }}
 */
export function hookSupport(agent) {
  return HOOK_HOSTS[agent] ?? { mechanism: "none", events: [], reason: "Unknown host" };
}
