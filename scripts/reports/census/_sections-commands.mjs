/**
 * @module scripts/reports/census/_sections-commands
 *
 * The slash commands, split into the kinds a reader picks between.
 *
 * The kinds are derived rather than listed: a persona command is one whose
 * name parses as a persona, an area command is one that names an area, and
 * whatever is left is a workflow. A new command therefore lands in a kind
 * without anyone editing this file. Only the session set is written, because
 * "crosses a context boundary" is a judgment no registry records.
 */

import { table } from "./_format.mjs";
import { ROUTER_COMMAND, parsePersonaName } from "./_registries.mjs";

/** The commands that carry a session across a context boundary. */
const SESSION = new Set(["rule-adr", "rule-compress", "rule-export", "rule-handoff", "rule-handon", "rule-init", "rule-keep", "rule-stats", "rule-update", "rule-usage"]);

/**
 * Every command, in its kind.
 *
 * @param {object} data - the gathered surface
 * @returns {Array<{kind: string, what: string, commands: string[]}>}
 */
export function commandKinds(data) {
  const kinds = { router: [], area: [], workflow: [], session: [], persona: [] };

  for (const name of data.commands) {
    if (name === ROUTER_COMMAND) {
      kinds.router.push(name);
    } else if (parsePersonaName(name)) {
      kinds.persona.push(name);
    } else if (SESSION.has(name)) {
      kinds.session.push(name);
    } else if (name.startsWith("rule-area-")) {
      kinds.area.push(name);
    } else {
      kinds.workflow.push(name);
    }
  }

  return [
    { kind: "router", what: "Send a free-text request to the skill that answers it", commands: kinds.router },
    { kind: "area", what: "Send free text to the skills of one area", commands: kinds.area },
    { kind: "workflow", what: "Run a named workflow", commands: kinds.workflow },
    { kind: "session", what: "Close, resume or measure a session", commands: kinds.session },
    { kind: "persona", what: "Run one review role and write its documents", commands: kinds.persona },
  ];
}

/** The counted breakdown, for the generated instructions document. */
export function commandKindsSection(data) {
  const kinds = commandKinds(data);
  const named = (kind) => kinds.find((entry) => entry.kind === kind);

  return [
    `### The kinds (${data.commands.length} commands)`,
    "",
    ...table(
      ["Kind", "Count", "Example", "Use it to"],
      kinds.map((entry) => [`\`${entry.kind}\``, entry.commands.length, `\`/${entry.commands[0] ?? "-"}\``, entry.what]),
    ),
    "",
    ...kinds.flatMap((entry) => {
      if (entry.kind === "persona") {
        return [];
      }

      if (entry.commands.length === 0) {
        return [`**${entry.kind}**: none`, ""];
      }

      return [`**${entry.kind}**: ${entry.commands.map((name) => `\`/${name}\``).join(", ")}`, ""];
    }),
    `There is one persona command per role. There are ${named("persona").commands.length}. [The personas page](18-personas.md) lists them.`,
    "",
  ];
}
