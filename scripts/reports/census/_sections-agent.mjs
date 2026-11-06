/**
 * @module scripts/reports/census/_sections-agent
 *
 * The sections that describe how an agent reaches the server: the slash
 * commands written into each host, and the hooks.
 */

import { table } from "./_format.mjs";
import { AGENTS_WITHOUT_COMMAND_SURFACE, COMMAND_TARGETS, ROUTER_COMMAND, hookEntries } from "./_registries.mjs";

/** The same command set, written in every host's own format. */
export function commandSection(data) {
  return [
    `## Agent slash commands (${data.commands.length})`,
    "",
    `The router \`/${ROUTER_COMMAND}\` comes first. The other commands follow in alphabetical order.`,
    "Every agent and IDE gets the same set, in its own format.",
    "",
    "This page does not list directories. They change with the machine and the agent.",
    "",
    ...table(
      ["Target", "Agent", "Format", "Scope", "Prefixes MCP prompts"],
      COMMAND_TARGETS.map((target) => [target.label, `\`${target.agent}\``, `\`${target.format}\``, target.scope, target.namespacedPrompts ? "yes" : "no"]),
    ),
    "",
    `${Object.keys(AGENTS_WITHOUT_COMMAND_SURFACE).length} more agents get the MCP configuration but no command files:`,
    "",
    ...table(
      ["Agent", "Why not"],
      Object.entries(AGENTS_WITHOUT_COMMAND_SURFACE).map(([agent, reason]) => [`\`${agent}\``, reason]),
    ),
    "",
  ];
}

/**
 * What each hook event carries, read from the entries the installer writes
 * rather than described beside them: the matcher, the guard command and the
 * status line are all in the entry, and a table that restated them by hand
 * would be a fourth copy that can disagree with the settings file.
 */
export function hookSection() {
  const entries = hookEntries({ command: "rule-mcp" });
  const rows = Object.entries(entries).flatMap(([event, list]) =>
    list.map((entry) => {
      const [hook] = entry.hooks;

      return [`\`${event}\``, entry.matcher ? `\`${entry.matcher}\`` : "-", `\`${hook.command.split("  #")[0]}\``, hook.statusMessage, `${hook.timeout}s`];
    }),
  );

  return [
    `## Hooks (${rows.length} entries across ${Object.keys(entries).length} events)`,
    "",
    "`install --agent claude` writes these entries into the host settings file.",
    "`uninstall` removes them. Each entry has a marker comment, so a merge or an",
    "uninstall changes only these entries. Each entry answers `ask` and never `deny`.",
    "",
    ...table(["Event", "Matcher", "Command", "What it says while it runs", "Timeout"], rows),
    "",
  ];
}
