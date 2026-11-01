/**
@module tools/keep

`rule_tool_keep`: confirm one decision into the export-owned decision-cache.
*/

import { z } from "zod/v4";
import { keepDecision } from "../../core/export/decision-cache/index.js";
import { registerTool } from "../router/index.js";

/** Register the rule_tool_keep tool. */
export function registerKeepTool() {
  const KeepSchema = z.object({
    fingerprint: z.string().min(1).describe("Stable fingerprint for the decision"),
    choice: z.string().describe("The choice to confirm (JSON string if structured)"),
    agent: z.string().optional(),
    projectDir: z.string().optional().describe("Project root; default cwd"),
  });

  registerTool({
    name: "rule_tool_keep",
    entry: "action",
    description: "Confirm one decision into the export decision-cache (status confirmed, source rule-keep).",
    zodSchema: KeepSchema,
    handler: async (arguments_) => {
      const projectDir = arguments_.projectDir || process.cwd();
      let choice = arguments_.choice;

      try {
        choice = JSON.parse(arguments_.choice);
      } catch {
        // plain string choices stay strings
      }

      const result = keepDecision({
        projectDir,
        fingerprint: arguments_.fingerprint,
        choice,
        agent: arguments_.agent,
      });

      if (!result.ok) {
        return {
          isError: true,
          content: [{ type: "text", text: `Keep refused: ${result.reason ?? "unknown"}` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Kept ${arguments_.fingerprint} as confirmed (schemaVersion ${result.record.schemaVersion}).`,
          },
        ],
        _meta: { ruleKeep: result.record },
      };
    },
  });
}
