/** Register the rule_tool_process_adr MCP tool. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { recordDecision } from "../../core/tokensave/_memory.js";
import { onTrunk } from "../../core/docs/adr-pending/_trunk.js";
import { registerTool } from "../router/index.js";
import { ADR_DIR, ADR_PENDING_DIR, nextAdrNumber, adrFilename, listExistingAdrs, slugify } from "./_files.js";
import { generateAdr } from "./_body.js";
import { adrEnglishOffenses } from "./_english.js";
import { updateAdrIndex } from "./_adr-index.js";
import { ADRSchema } from "./_schema.js";
import { supersedeOffense } from "./_validate.js";
import { registerAutoAdrHook } from "./_auto-log.js";
import { allowsAdrWrite, adrRule, resolveAdrPolicy } from "../../core/adr-policy/index.js";

/**
 * Register the ADR tool: English-gated authoring with auto-numbering and
 * index maintenance, plus the optional auto-log hook.
 */
export function registerProcessAdrTool() {
  registerTool({
    name: "rule_tool_process_adr",
    entry: "skill",
    description: "Save an Architecture Decision Record (ADR) to docs/adr/. Auto-numbers, maintains index, uses Nygard template. Honors RULE_MCP_ADR_POLICY (default: handoff).",
    zodSchema: ADRSchema,
    handler: async (arguments_) => {
      const projectDir = arguments_.projectDir || ".";
      const policy = resolveAdrPolicy({ projectDir });
      const moment = arguments_.moment || "task";
      const category = arguments_.category;
      const alternatives = typeof arguments_.alternatives === "string" ? [arguments_.alternatives] : (arguments_.alternatives ?? []);
      const tags = typeof arguments_.tags === "string" ? [arguments_.tags] : (arguments_.tags ?? ["architecture"]);

      if (!allowsAdrWrite(policy, { category, moment, explicit: true })) {
        const hint = 'Pass moment: "handoff" at session close, set RULE_MCP_ADR_POLICY=full, or override the category.';

        return {
          content: [
            {
              type: "text",
              text: [
                "Not written.",
                "",
                adrRule(policy),
                "",
                `Policy: ${policy.default} (source: ${policy.source})${category ? `; category ${category}` : ""}; moment: ${moment}.`,
                hint,
              ].join("\n"),
            },
          ],
        };
      }

      const offenses = adrEnglishOffenses({ ...arguments_, alternatives, tags });

      if (offenses.length > 0) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: [
                "❌ ADR rejected: every ADR is written in English, filename included.",
                "",
                ...offenses.slice(0, 10).map((offense) => `- ${offense}`),
                "",
                "Rewrite the title and body in English (American spelling) and call the tool again.",
              ].join("\n"),
            },
          ],
        };
      }

      const offense = supersedeOffense(arguments_);

      if (offense) {
        return { isError: true, content: [{ type: "text", text: offense }] };
      }

      const pending = !onTrunk(projectDir);
      const adrDir = join(projectDir, ADR_DIR);
      const writeDir = pending ? join(projectDir, ADR_PENDING_DIR) : adrDir;

      mkdirSync(writeDir, { recursive: true });

      const number = pending ? null : nextAdrNumber(adrDir);
      const slug = slugify(arguments_.title);
      const content = generateAdr({
        number,
        title: arguments_.title,
        status: arguments_.status || "accepted",
        context: arguments_.context || "",
        decision: arguments_.decision || "",
        consequences: arguments_.consequences || "",
        alternatives,
        endsWhen: arguments_.endsWhen,
        supersedes: arguments_.supersedes,
        supersededBy: arguments_.supersededBy,
        tags,
        pending,
      });

      const filename = pending ? `${slug}.md` : adrFilename(number, arguments_.title);
      const filePath = join(writeDir, filename);

      writeFileSync(filePath, content);

      if (!pending) {
        // Update index - listExistingAdrs reads from disk (already includes the new ADR)
        updateAdrIndex(adrDir, listExistingAdrs(adrDir));
      }

      // The ADR file is the source of truth; the graph keeps a recall index
      // beside it. A missing graph is a no-op, never a failure.
      recordDecision(projectDir, {
        text: arguments_.title,
        reason: arguments_.decision || arguments_.context || "",
        files: [filePath],
        tags,
      });

      const label = pending ? `ADR ${slug}` : String(number).padStart(3, "0");

      return {
        content: [
          {
            type: "text",
            text: [
              `✅ ${label} created: ${arguments_.title}`,
              "",
              `File: ${filePath}`,
              pending ? "Pending: numbers on trunk landing (`rule-mcp handoff land`)." : null,
              `Status: ${arguments_.status || "accepted"}`,
              `Tags: ${tags.join(", ")}`,
              "",
              "```markdown",
              content,
              "```",
            ]
              .filter((line) => line !== null)
              .join("\n"),
          },
        ],
      };
    },
  });

  registerAutoAdrHook();
}
