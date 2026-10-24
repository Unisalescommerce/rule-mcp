/** @module cli/install/hook-writers - the plugin and extension sources */

/**
 * An OpenCode plugin that runs the guard before and after a tool call.
 *
 * @param {string} command
 * @returns {string}
 */
export function opencodePlugin(command) {
  return [
    "export const RuleMcpHooks = async () => ({",
    `  "tool.execute.before": async (input) => { await Bun.$` + "`" + `${${JSON.stringify(command)}} ${input.tool}` + "`" + `; },`,
    `  "tool.execute.after": async (input) => { await Bun.$` + "`" + `${${JSON.stringify(command)}} ${input.tool}` + "`" + `; },`,
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
    `  pi.on("tool_call", async (event) => { await pi.exec(${JSON.stringify(command)}, [event.toolName]); });`,
    `  pi.on("tool_result", async (event) => { await pi.exec(${JSON.stringify(command)}, [event.toolName]); });`,
    "}",
    "",
  ].join("\n");
}
