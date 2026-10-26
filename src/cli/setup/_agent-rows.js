/**
 * @module cli/setup/agent-rows
 *
 * The agent catalog as list rows: sectioned, badged, and pre-selected.
 *
 * Detection reads two different facts and the row shows both. "Present"
 * means the agent is on this machine; "configured" means it already points
 * at this server. An agent that is absent stays in the list, unselected, so
 * a user installing ahead of an agent can still tick it - a picker that
 * offered only what it detected collapsed to two rows on a fresh machine,
 * which is exactly when the rest is wanted.
 *
 * A deprecated name stays in the list too, labeled with what replaced it: it
 * is still installable and still removable, it is just never swept by
 * `--agent all`.
 */

import { allAgents, deprecatedAgents } from "../installers/index.js";
import { detectInstalledAgents } from "../install/index.js";
import { GLYPHS } from "./_theme.js";
import { hostRecord } from "../installers/hosts/index.js";
import { rungWords } from "../installers/hosts/_levels.js";
import { nonInstallable } from "../installers/hosts/_evidence.data.js";

/** One line naming how deep this host can be integrated, and what that adds. */
const ceilingLine = (id) => {
  const record = hostRecord(id);

  if (!record) {
    return "integration: unknown";
  }

  return `integration: ${rungWords(record.ceiling)}`;
};

/** Where the catalog stops listing coding agents and starts listing IDEs. */
const IDE_START = allAgents.indexOf("vscode");

/**
 * Every agent, with what detection knows about it.
 *
 * The flat form the rows are built from, and the one a caller wants when it
 * needs the catalog rather than a rendered list.
 *
 * @returns {Array<{ name: string, present: boolean, configured: boolean, configFile: string|null, deprecated: string|undefined }>}
 */
export function agentCatalog() {
  const status = new Map(detectInstalledAgents().map((agent) => [agent.name, agent]));

  return allAgents.map((name) => {
    const entry = status.get(name);

    return {
      name,
      present: Boolean(entry?.configFile),
      configured: Boolean(entry?.configured),
      configFile: entry?.configFile ?? null,
      deprecated: deprecatedAgents.get(name),
    };
  });
}

/**
 * The products the study measured that this install cannot target.
 *
 * They are what the table row means: `aider` was measured and has no documented
 * MCP config file, so it is a finding, not an omission. One row for the group
 * says that; a disabled checkbox per product would suggest a choice that does not
 * exist.
 */
const measuredSection = () => {
  const measured = nonInstallable();

  if (measured.length === 0) {
    return [];
  }

  const gaps = measured.filter((row) => !row.coveredBy);
  const covered = measured.filter((row) => row.coveredBy);
  const lines = [`${gaps.length} measured: ${gaps.map((row) => row.id).join(", ")}`, "no documented MCP config file was found for these, so there is nothing to write"];

  if (covered.length > 0) {
    lines.push(...covered.map((row) => `${row.id} works through ${row.coveredBy}, same config file`));
  }

  return [
    { section: true, label: "Measured, no config file", id: "section:measured" },
    {
      id: "measured:none",
      label: lines[0],
      note: `${gaps.length} products`,
      detail: lines,
      // Readable, not selectable. The row is a finding about the study, and its
      // id is not an agent name: ticking it sent `measured:none` to
      // `installAgent`, which answered "Unsupported agent" on the plan screen.
      disabled: true,
    },
  ];
};

/**
 * Build the rows and the sets that should start ticked.
 *
 * @returns {{ items: object[], detected: string[], configured: string[] }}
 */
export function agentRows() {
  const catalog = agentCatalog();
  const detected = catalog.filter((entry) => entry.present && !entry.deprecated).map((entry) => entry.name);
  const configured = catalog.filter((entry) => entry.configured).map((entry) => entry.name);

  const toRow = (entry) => ({
    id: entry.name,
    label: entry.deprecated ? `${entry.name} (superseded by ${entry.deprecated})` : entry.name,
    note: entry.configured ? `${GLYPHS.ok} configured` : entry.present ? `${GLYPHS.radioOn} detected` : "",
    noteTone: entry.configured ? "ok" : entry.present ? "info" : undefined,
    // An array, never a bare string: the detail panel iterates lines, and a
    // string would be drawn one character per row. The second line is the
    // integration ceiling, so the depth screen never offers a level this host
    // cannot reach without the reader having seen why.
    detail: [entry.configFile ?? "no config file on this machine yet", ceilingLine(entry.name)],
  });

  const items = [
    { section: true, label: "Coding agents", id: "section:agents" },
    ...catalog.slice(0, IDE_START).map((entry) => toRow(entry)),
    { section: true, label: "IDEs", id: "section:ides" },
    ...catalog.slice(IDE_START).map((entry) => toRow(entry)),
    ...measuredSection(),
  ];

  return { items, detected, configured };
}
