/** The auto-ADR hook: log significant tool calls as lightweight ADR entries. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { addAfterToolHook } from "../router/index.js";
import { ADR_DIR, ADR_PENDING_DIR, slugify, nextAdrNumber, listExistingAdrs } from "./_files.js";
import { updateAdrIndex } from "./_adr-index.js";
import { autoLogFields } from "./_auto-log-fields.js";
import { allowsAdrWrite, resolveAdrPolicy } from "../../core/adr-policy/index.js";
import { onTrunk } from "../../core/docs/adr-pending/_trunk.js";

/**
 * Auto-create an ADR after significant tool calls.
 * Summary-level: title + context only, no full decision.
 */
export async function autoLog(toolName, arguments_, result) {
  const testProcess = process.argv.some((argument) => /(?:^|[\\/])test[\\/]/.test(argument));

  if (process.env.RULE_MCP_DISABLE_AUTO_ADR === "1" || process.env.NODE_ENV === "test" || testProcess) {
    return;
  }

  const projectDir = arguments_.projectDir || ".";
  const policy = resolveAdrPolicy({ projectDir });

  // Policy on-demand ("off") and mid-task under handoff: AUTO_ADR writes nothing.
  if (!allowsAdrWrite(policy, { moment: "task" })) {
    return;
  }

  const relevant = ["rule_tool", "rule_tool_detect"];

  if (!relevant.includes(toolName)) {
    return;
  }

  const pending = !onTrunk(projectDir);
  const adrDir = join(projectDir, ADR_DIR);
  const writeDir = pending ? join(projectDir, ADR_PENDING_DIR) : adrDir;
  mkdirSync(writeDir, { recursive: true });

  const number = pending ? null : nextAdrNumber(adrDir);
  const now = new Date().toISOString();
  const dateString = now.slice(0, 10);
  const timeString = now.slice(11, 19);
  const { title, tags, contextLines, decisionLines } = autoLogFields(toolName, arguments_, result);
  const slug = slugify(title.slice(0, 60));
  const heading = pending ? `# Pending: ${title}` : `# ${String(number).padStart(3, "0")}: ${title}`;

  const content = [
    heading,
    "",
    `- **Date**: ${dateString} ${timeString}`,
    `- **Status**: accepted`,
    `- **Tags**: ${tags}`,
    "- **Author**: rule-mcp",
    "",
    "## Context",
    "",
    ...contextLines,
    "",
    "## Decision",
    "",
    ...decisionLines,
    "",
    "## Consequences",
    "",
    "None - informational entry.",
    "",
  ].join("\n");

  const filename = pending ? `${slug}.md` : `${String(number).padStart(3, "0")}-${slug}.md`;
  writeFileSync(join(writeDir, filename), content);

  if (!pending) {
    updateAdrIndex(adrDir, listExistingAdrs(adrDir));
  }
}

/** Wire the auto-ADR hook. Disabled by default; enable with RULE_MCP_AUTO_ADR=1. */
export function registerAutoAdrHook() {
  if (process.env.RULE_MCP_AUTO_ADR === "1") {
    addAfterToolHook("*", autoLog);
  }
}
