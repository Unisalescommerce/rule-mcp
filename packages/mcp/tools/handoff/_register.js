/** Register the rule_tool_handoff MCP tool. */
import { registerTool } from "../router/index.js";
import { HandoffSchema } from "./_schema.js";
import { buildHandoff } from "./_build.js";

/** Register the rule_tool_handoff tool. */
export function registerHandoffTool() {
  registerTool({
    name: "rule_tool_handoff",
    entry: "action",
    description:
      "Close a session or generate a compressed handoff from ADRs and project context to resume work. Archive completed audit, review and plan records as ADRs and repair numbering first; pass closeout: false to diagnose without writing.",
    zodSchema: HandoffSchema,
    handler: async (arguments_) => {
      const result = buildHandoff({
        projectDir: arguments_.projectDir || ".",
        mode: arguments_.mode || "handoff",
        closeout: arguments_.closeout,
        includeContext: arguments_.includeContext !== false,
        includeAdrs: arguments_.includeAdrs !== false,
        includeIdentity: arguments_.includeIdentity !== false,
        includeGitDiff: arguments_.includeGitDiff !== false,
        includeGitLog: arguments_.includeGitLog !== false,
        includeRoadmap: arguments_.includeRoadmap !== false,
        compress: !!arguments_.compress,
        maxTokens: arguments_.maxTokens || 0,
        format: arguments_.format || "full",
      });

      const text = [result.text];
      const modeLabel = arguments_.mode === "close-session" ? "Session Close" : "Handoff";

      text.push(
        "---",
        `_${modeLabel}: ${result.stats.format}, ${result.stats.adrs} ADRs, ${result.stats.contextKeys} keys, ${result.stats.lines} lines, ~${result.stats.tokens} tokens._`,
      );

      return {
        content: [
          {
            type: "text",
            text: text.join("\n"),
          },
        ],
      };
    },
  });
}
