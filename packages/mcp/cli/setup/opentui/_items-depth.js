/**
 * @module cli/setup/opentui/items-depth
 *
 * The two screens that ask how the server reaches an agent and how much of it
 * is written: the transport, and the depth.
 *
 * Split out of `items.js`, which is past the 150-line cap and may only shrink
 * (ADR 061, ADR 186). The depth screen owns a vocabulary of its own - the rungs
 * in words - so it is a concern, not a slice of one.
 */

import { remoteModeAgents } from "../../installers/index.js";
import { hostRecord } from "../../installers/hosts/index.js";
import { RUNG_WORDS, rungWords } from "../../installers/hosts/_levels.js";

/** The three transports, with what each one costs the user. */
const MODE_ITEMS = [
  {
    id: "stdio",
    label: "stdio",
    detail: ["The agent starts a local process per session.", "No background service, no port, works everywhere.", "", "Supported by every agent in the catalog."],
  },
  {
    id: "daemon",
    label: "daemon",
    detail: ["One background SSE service on port 37999.", "Registered with launchd, systemd, or the Windows", "service manager and started at login."],
  },
  {
    id: "docker",
    label: "docker",
    detail: ["The SSE service in a container via compose.", "Needs Docker Compose v2 and a daemon token."],
  },
];

/**
 * The transport rows for the agents on the previous screen.
 *
 * Daemon and docker are discouraged, never removed, when someone selected
 * cannot use them: the row names who, so the reason travels with the choice
 * instead of arriving later as a per-agent failure.
 *
 * @param {string[]} [agents]
 */
/** The integration levels, with what each one writes and what it costs. */
const LEVEL_ITEMS = [
  { id: "auto", label: "Everything each host supports", note: "recommended" },
  { id: "L0", label: RUNG_WORDS.L0.title, note: RUNG_WORDS.L0.adds },
  { id: "L1", label: RUNG_WORDS.L1.title, note: RUNG_WORDS.L1.adds },
  { id: "L2", label: RUNG_WORDS.L2.title, note: RUNG_WORDS.L2.adds },
  { id: "L3", label: RUNG_WORDS.L3.title, note: RUNG_WORDS.L3.adds },
  { id: "L4", label: RUNG_WORDS.L4.title, note: RUNG_WORDS.L4.adds },
];

/**
 * The depth choices, with the ceilings of the hosts the user just picked.
 *
 * The ceiling belongs on this screen because the choice is a cap, not a
 * promise: picking the deepest row with Zed selected writes the server entry
 * and stops there, and the row says so before the user commits to it. The
 * per-host lines are words, not rungs: `zed: server only` answers the question
 * the reader has, and `zed: L0` answers it only for someone who has read the
 * table in the operations guide.
 */
export function depthItems(agents = []) {
  const ceilings = [...new Set(agents.map((agent) => hostRecord(agent)?.ceiling).filter(Boolean))].sort();
  const perHost = agents.length > 0 ? agents.map((agent) => `${agent}: ${rungWords(hostRecord(agent)?.ceiling ?? "L0")}`) : ["No host selected yet."];

  return LEVEL_ITEMS.map((item) => ({
    ...item,
    note: item.id === "auto" ? (ceilings.length > 0 ? "no cap" : "recommended") : item.note,
    detail: [
      item.id === "auto"
        ? "No cap: every selected host writes every part it supports, and the review lists what each one wrote."
        : "A cap, not a promise: a host that stops lower says so below, and the review lists what each one wrote.",
      item.id === "auto" ? "" : `Scripted installs name this row as --level ${item.id}.`,
      "",
      ...perHost,
    ],
  }));
}

/**
 * The transport rows for the agents on the previous screen.
 *
 * Daemon and docker are discouraged, never removed, when someone selected
 * cannot use them: the row names who, so the reason travels with the choice
 * instead of arriving later as a per-agent failure.
 *
 * @param {string[]} [agents]
 * @returns {Array<{ id: string, label: string, note: string, detail: string[] }>}
 */
export function modeItems(agents = []) {
  const unsupported = agents.filter((agent) => !remoteModeAgents.has(agent));

  if (agents.length === 0 || unsupported.length === 0) {
    return MODE_ITEMS.map((item) => ({ ...item, note: item.id === "stdio" ? "" : `${remoteModeAgents.size} hosts` }));
  }

  const note = `not recommended${unsupported.length > 0 ? ` for ${unsupported.join(", ")}` : ""}`;

  return MODE_ITEMS.map((item) => ({
    ...item,
    label: item.id === "stdio" ? item.label : `${item.label} (${note})`,
    note: item.id === "stdio" ? "" : `${[...remoteModeAgents].join(", ")} only`,
  }));
}
