/**
 * The Devin installer: the MCP entry, plus the command files Devin reads as
 * skills.
 * @module cli/installers/devin
 */

import { join } from "node:path";

import { renderAgentCommandFiles } from "../../core/agents/commands/index.js";
import { commandConfig } from "./_env-command.js";
import { HOME, readText, writeText } from "./_paths.js";
import { upsertJsonServer } from "./_writers-json.js";

/** Where Devin keeps its server list. */
export const devinConfigPath = () => {
  if (process.platform === "win32") {
    return join(process.env.APPDATA || join(HOME, "AppData", "Roaming"), "devin", "mcp_config.json");
  }

  return join(HOME, ".config", "devin", "mcp_config.json");
};

/**
 * Write the server entry, and the command files when the Commands step asked
 * for them.
 *
 * Devin invokes commands as /<name> from ~/.config/devin/skills: one directory
 * per skill, each holding a SKILL.md. The file declares the bare name, the same
 * shape Codex and Copilot CLI read - the slash is the invocation, never the
 * declaration.
 *
 * These are command files, so they follow the Commands step: an install that
 * declined it writes the server entry and nothing here.
 */
export const installDevin = ({ entrypoint, dryRun, global, commands = true }) => {
  const results = [
    writeText({
      file: devinConfigPath(),
      content: upsertJsonServer(readText(devinConfigPath()), commandConfig(entrypoint, { global, agentName: "devin" })),
      dryRun,
    }),
  ];

  if (!commands) {
    return results;
  }

  const base = join(HOME, ".config", "devin", "skills");

  for (const { filename, content } of renderAgentCommandFiles("skill")) {
    results.push(writeText({ file: join(base, filename), content, dryRun }));
  }

  return results;
};
