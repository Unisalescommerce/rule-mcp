/**
 * @module tools/actions/write-plan
 *
 * MCP surface for durable development plans under docs/plans/_*.md.
 */
import { z } from "zod/v4";

import { writeDevelopmentPlan } from "../../core/plans/_write.js";
import { registerTool } from "../router/index.js";

const WritePlanSchema = z.object({
  slug: z.string().describe("Plan file stem; leading _ added if missing. Single segment only."),
  title: z.string().describe("Short plan title used in plan-of-plans snapshot"),
  body: z.string().optional().describe("Full markdown body (must pass WSn / dual-graph shape)"),
  topic: z.string().optional().describe("When body is omitted, seed a scaffold that mentions this topic"),
  overwrite: z.boolean().optional().describe("Replace an existing docs/plans/_slug.md (default false)"),
  openWork: z.string().optional().describe("Open-work cell for the plan-of-plans snapshot row"),
  projectDir: z.string().optional(),
});

/** Register rule_tool_write_plan. */
export function registerWritePlanTool() {
  registerTool({
    name: "rule_tool_write_plan",
    entry: "action",
    description:
      "Write a durable development plan to docs/plans/_<slug>.md and register it in plan-of-plans.md. Host CreatePlan files are not the source of truth.",
    zodSchema: WritePlanSchema,
    advertise: ["slug", "title", "body", "overwrite"],
    handler: async (arguments_) => {
      const result = writeDevelopmentPlan(arguments_);

      if (!result.ok) {
        return {
          isError: true,
          content: [{ type: "text", text: `Not written.\n\n${result.error}` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: [
              `Wrote ${result.path}`,
              result.indexPatched ? "Registered in docs/plans/plan-of-plans.md" : "plan-of-plans.md already listed this file",
              "",
              "Durable plans live under docs/plans/_*.md. Host CreatePlan under ~/.local/share/opencode/plans/ is session UI only.",
            ].join("\n"),
          },
        ],
      };
    },
  });
}
