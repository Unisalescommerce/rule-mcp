/** @module cli/install/hook-writers - the plugin and extension sources */

/**
 * An OpenCode plugin that runs the guard before and after a tool call.
 *
 * @param {string} command
 * @returns {string}
 */
export function opencodePlugin(command) {
  return [
    'import { execFileSync } from "node:child_process";',
    "export const RuleMcpHooks = async () => ({",
    `  "tool.execute.before": async (input) => { execFileSync(${JSON.stringify(command)}, ["hook", input.tool]); },`,
    `  "tool.execute.after": async (input) => { execFileSync(${JSON.stringify(command)}, ["hook", input.tool]); },`,
    "});",
    "",
  ].join("\n");
}

/**
 * A Pi extension that registers the two tool events.
 *
 * @param {string} command
 * @returns {string}
 */
export function piExtension(command) {
  return [
    "export default function ruleMcpHooks(pi) {",
    `  pi.on("tool_call", async (event) => { await pi.exec(${JSON.stringify(command)}, ["hook", event.toolName]); });`,
    `  pi.on("tool_result", async (event) => { await pi.exec(${JSON.stringify(command)}, ["hook", event.toolName]); });`,
    "}",
    "",
  ].join("\n");
}

/**
 * The `hooks` object Gemini CLI reads from settings.json.
 *
 * @param {string} command
 * @returns {object}
 */
export function geminiHooks(command) {
  const group = [{ matcher: ".*", hooks: [{ type: "command", command }] }];

  return { BeforeTool: group, AfterTool: group };
}

/**
 * The Codex `hooks.json` object: one matcher group per tool event.
 *
 * @param {string} command
 * @returns {object}
 */
export function codexHooks(command) {
  const group = [{ matcher: "Bash|apply_patch|Edit|Write", hooks: [{ type: "command", command }] }];

  return { PreToolUse: group, PostToolUse: group };
}
