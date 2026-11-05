/** Register the rule_tool_handon MCP tool. */
import { z } from "zod/v4";
import { registerTool } from "../router/index.js";
import { handon } from "./_handon.js";

const HandonSchema = z.object({
  projectDir: z.string().optional().default(".").describe("Project root directory"),
  file: z.string().optional().describe("A specific handoff to read instead of the newest"),
  list: z.boolean().optional().default(false).describe("List the handoffs and verify nothing"),
  closeout: z
    .union([z.boolean(), z.literal("preview")])
    .optional()
    .default(true)
    .describe(
      'Archive completed audits/reviews/plans into ADRs, retire them from the plan indexes and delete the sources (default true). "preview" lists what would close out and writes nothing; false skips the sweep entirely',
    ),
});

/** Register the rule_tool_handon tool. */
export function registerHandonTool() {
  registerTool({
    name: "rule_tool_handon",
    entry: "action",
    description:
      "Verify the last session handoff before you resume: check its branch, commit range, files, ADRs and open work. Close completed audit, review and plan records first, then propose the next plan workstream for confirmation. Never re-run a claimed command.",
    zodSchema: HandonSchema,
    handler: async (arguments_) => ({
      content: [{ type: "text", text: handon(arguments_ ?? {}).text }],
    }),
  });
}
