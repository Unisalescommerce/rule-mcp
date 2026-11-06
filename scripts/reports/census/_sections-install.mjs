/**
 * @module scripts/reports/census/_sections-install
 *
 * The install targets, the files each one gets, and how deep each host can go.
 *
 * `allAgents` is the list `install --agent <name>` and the setup wizard accept;
 * `COMMAND_TARGETS` and `AGENTS_WITHOUT_COMMAND_SURFACE` decide whether a host
 * also receives per-command files; `hostRecord` holds the integration ceiling.
 * Reading all of them means the page cannot promise a host the installer does
 * not have, or miss one it gained.
 */

import { table } from "./_format.mjs";
import { AGENTS_WITHOUT_COMMAND_SURFACE, COMMAND_TARGETS, allAgents, hostRecord, remoteModeAgents } from "./_registries.mjs";

const yes = (flag) => (flag ? "yes" : "-");

/** One row per host: the ceiling, then each rung above the MCP entry. */
export function ceilingRows() {
  return allAgents.map((host) => {
    const { ceiling, levels } = hostRecord(host);

    return [`\`${host}\``, ceiling, yes(levels.L1.supported), yes(levels.L2.supported), yes(levels.L3.supported), levels.L4.supported ? (levels.L4.status ?? "yes") : "-"];
  });
}

/**
 * @param {object} _data - the gathered surface (this section reads the registries directly)
 * @returns {string[]}
 */
export function agentTargetSection(_data) {
  const commands = new Map();

  for (const target of COMMAND_TARGETS) {
    const entry = commands.get(target.agent) ?? { formats: new Set(), scopes: new Set() };

    entry.formats.add(target.format);
    entry.scopes.add(target.scope);
    commands.set(target.agent, entry);
  }

  const rows = allAgents.map((agent) => {
    const entry = commands.get(agent);
    const commandFiles = entry ? `yes: ${[...entry.formats].join(", ")} (${[...entry.scopes].join(", ")})` : "no";
    const transport = remoteModeAgents.has(agent) ? "stdio, daemon, docker" : "stdio";
    const note = AGENTS_WITHOUT_COMMAND_SURFACE[agent] ?? "";

    return [`\`${agent}\``, commandFiles, transport, note];
  });

  const legacy = [...commands.keys()].filter((agent) => !allAgents.includes(agent));

  return [
    `## Install targets (${allAgents.length})`,
    "",
    "`rule-mcp install --agent <name>` and the setup wizard accept these names.",
    "A host with command files also gets the slash commands in its own format.",
    "The other hosts get the MCP configuration and use the same prompts through the server.",
    "",
    ...table(["`--agent`", "Command files", "Transport", "Notes"], rows),
    "",
    // A command target keyed under a name the installer no longer accepts is a
    // real gap: the files exist for a host that cannot be asked for by that
    // name. Naming it here beats leaving the reader to infer it from a "no".
    ...(legacy.length > 0
      ? [`Command files also exist under ${legacy.map((name) => `\`${name}\``).join(", ")}. The installer does not accept this name, so no install writes these files.`, ""]
      : []),
    `There are ${COMMAND_TARGETS.length} slash-command targets for ${commands.size} hosts. [The instructions page](16-instructions.md) lists the formats.`,
    "",
    "## Integration ceiling per host",
    "",
    "The ceiling is the deepest level that a host supports. [Integration levels](06-integration-levels.md) tells what each level writes.",
    "",
    ...table(["Host", "Ceiling", "Rules", "Commands", "Hooks", "Handler"], ceilingRows()),
    "",
  ];
}
