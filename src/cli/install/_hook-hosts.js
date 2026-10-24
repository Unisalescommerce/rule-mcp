/** @module cli/install/hook-hosts - which hosts document a hook mechanism */

/**
 * A host is hookable only when its documentation names the events and the
 * configuration file. Anything else would be a guess, so it stays disabled.
 */
export const HOOK_HOSTS = {
  claude: { supported: true, events: ["PreToolUse", "PostToolUse", "SessionStart"], reason: "Documented lifecycle hooks" },
  cursor: { supported: true, events: ["PreToolUse", "PostToolUse"], reason: "Documented hooks, fail-open" },
  gemini: { supported: true, events: ["PreToolUse", "PostToolUse"], reason: "Documented hooks, fail-open" },
  codex: { supported: false, events: [], reason: "No user-facing hook mechanism" },
  copilot: { supported: false, events: [], reason: "No documented hook mechanism" },
};

/**
 * @param {string} agent
 * @returns {{ supported: boolean, events: string[], reason: string }}
 */
export function hookSupport(agent) {
  return HOOK_HOSTS[agent] ?? { supported: false, events: [], reason: "Unknown host" };
}
