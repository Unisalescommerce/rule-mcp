/**
 * @module cli/setup/opentui/items
 *
 * Every screen's content, as plain data.
 *
 * The renderer knows how to draw a row and a line; what a row says, what it
 * explains, and which tone it carries is decided here. That split is what
 * makes the wizard testable without a terminal: a test asserts the sentence
 * the user reads, not the pixels it was drawn with.
 *
 * A tone is a semantic name (`ok`, `warn`, `muted`...) that the screen maps
 * onto the palette, so no hex value has to travel through the flow.
 */

import { areasOfSkills, isRootSkill } from "../../../core/skills/_surface.js";
import { MINIMAL_ALLOWLIST } from "../../../core/skills/_minimal.js";
import { getSkillNames } from "../../../tools/router/index.js";
import { hookSupport } from "../../install/_hook-hosts.js";
import { DIMENSION_DETAIL, DIMENSIONS, PROFILES } from "../../install/_profiles.js";
import { remoteModeAgents } from "../../installers/index.js";
import { statusStyle, GLYPHS } from "../_theme.js";

/** The tone a task status maps onto. */
export const statusTone = (status) => (status === "running" ? "info" : status === "pending" ? "muted" : status);

/**
 * The profile rows, with the dimensions each one turns on.
 *
 * @returns {Array<{ id: string, label: string, note: string, detail: string[] }>}
 */
export function profileItems() {
  return Object.entries(PROFILES).map(([id, profile]) => ({
    id,
    label: profile.label,
    note: profile.dimensions.length > 0 ? `${profile.dimensions.length} of ${DIMENSIONS.length} dimensions` : "pick each",
    detail: [
      profile.description,
      "",
      ...(profile.dimensions.length > 0
        ? profile.dimensions.map((dimension) => `${dimension} - ${DIMENSION_DETAIL[dimension]}`)
        : ["Every dimension is a checkbox on the next screen.", "Nothing is preselected there."]),
      "",
      `Tool surface: ${profile.surface}`,
    ],
  }));
}

/**
 * The per-dimension checklist, with what each one writes on this machine.
 *
 * The agent-scoped rows read their paths off the registries rather than naming
 * them in prose: the prose had drifted before, advertising `./CLAUDE.md` which
 * no install writes. A disabled row keeps its detail so the reason travels
 * with the row instead of being a tick the plan ignores.
 *
 * @param {{ agents?: string[], ruleFiles?: string[] }} [options]
 * @returns {Array<{ id: string, label: string, note: string, detail: string[], disabled?: boolean }>}
 */
export function dimensionItems({ agents = [], ruleFiles = [] } = {}) {
  const forAgents = agents.length > 0 ? agents.join(", ") : "no agent selected";
  const hookable = agents.filter((agent) => hookSupport(agent).writable);

  return DIMENSIONS.map((id) => {
    if (id === "rules") {
      return {
        id,
        label: "Instruction rules",
        note: `${ruleFiles.length} file(s)`,
        detail: [
          `Appends the rule-mcp workflow block for: ${forAgents}`,
          "",
          ...(ruleFiles.length > 0 ? ruleFiles : ["No instruction file on this machine yet."]),
          "",
          "Removable: the block is sentinel-delimited.",
        ],
      };
    }

    if (id === "commands") {
      return {
        id,
        label: "Agent slash commands",
        note: "per agent directory",
        detail: ["Writes the rule-* command files into the", `command directories of: ${forAgents}`],
      };
    }

    if (id === "hooks") {
      return {
        id,
        label: "Guard hooks",
        note: hookable.length > 0 ? `${hookable.length} host(s)` : "no host",
        disabled: hookable.length === 0,
        detail:
          hookable.length > 0
            ? [
                "Writes the PreToolUse/PostToolUse guards for:",
                hookable.join(", "),
                "",
                "Only the selected agents are touched; hosts",
                "without a documented mechanism are skipped.",
              ]
            : ["No selected agent documents a hook", "mechanism - this step has nothing to write."],
      };
    }

    if (id === "doctor") {
      return { id, label: "Health check", note: "never blocks", detail: [DIMENSION_DETAIL.doctor] };
    }

    return { id, label: "MCP server entry", note: forAgents, detail: [DIMENSION_DETAIL.server] };
  });
}

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

/**
 * The surface presets, plus the way out of the one-screen case.
 *
 * A preset whose price is invisible is chosen blind, so every row carries the
 * number of tools it keeps.
 *
 * @returns {Array<{ id: string, label: string, note: string, detail: string[] }>}
 */
export function surfaceItems() {
  const skills = getSkillNames();
  const hubs = skills.filter((name) => isRootSkill(name)).length;

  return [
    {
      id: "full",
      label: "Full",
      note: `${skills.length} skill tools`,
      detail: ["Every skill tool, and the slash commands of the same tier:", "area hubs, personas and tasks."],
    },
    {
      id: "standard",
      label: "Standard",
      note: `${hubs} hub tools`,
      detail: ["The area hubs only as tools; slash commands cover", "area hubs, personas and tasks."],
    },
    {
      id: "minimal",
      label: "Minimal",
      note: `${MINIMAL_ALLOWLIST.size} tools`,
      detail: ["The dispatcher and its action tools; slash commands", "are the router and the area hubs."],
    },
    {
      id: "custom",
      label: "Custom",
      note: "areas, then skills",
      detail: ["Choose areas, then skills. The same choice picks the", "slash commands - there is no second screen for them."],
    },
  ];
}

/**
 * The command selection that rides with a surface answer.
 *
 * One vocabulary: the Surface step is the only place that picks a tier, and
 * the slash-command files follow that tier instead of asking again.
 *
 * @param {{ preset?: string, areas?: string[], skills?: string[] }|null} surface
 * @returns {{ preset?: string, families?: string[], areas?: string[], skills?: string[] }|null}
 */
export function selectionFromSurface(surface) {
  if (!surface) {
    return null;
  }

  if (surface.preset) {
    return { preset: surface.preset };
  }

  if (surface.areas) {
    return { families: ["areas", "personas", "tasks"], areas: surface.areas };
  }

  if (surface.skills) {
    return { families: ["areas", "personas", "tasks"], skills: surface.skills };
  }

  return null;
}

/** One row per area the catalog covers, with its skill count. */
export function surfaceAreaItems() {
  const skills = getSkillNames();

  return areasOfSkills(skills).map((area) => {
    const members = skills.filter((name) => name === `rule-${area}` || name.startsWith(`rule-${area}-`));

    return { id: area, label: area, note: `${members.length} skills`, detail: [`The ${area} hub and its ${members.length - 1} member skills.`] };
  });
}

/** The skills of the chosen areas, hub rows first. */
export function surfaceSkillItems(areas) {
  return getSkillNames()
    .filter((name) => areas.includes(name.split("-")[1]))
    .map((name) => ({
      id: name,
      label: name,
      note: isRootSkill(name) ? "hub" : "",
      detail: [isRootSkill(name) ? "Area hub: kept either way." : "Member skill tool."],
    }));
}

/** One line for the review screen: what the surface answer keeps. */
export function surfaceLabel(surface) {
  if (!surface) {
    return "saved surface (unchanged)";
  }

  if (surface.preset) {
    return `surface ${surface.preset}`;
  }

  return `surface ${surface.areas ? `areas ${surface.areas.join(",")}` : `${surface.skills.length} skills`}`;
}

/** The checks preflight found, as lines. */
export function preflightLines(checks) {
  return checks.map((check) => ({
    text: `${statusStyle(check.status).glyph} ${check.label.padEnd(18)} ${check.detail}`,
    tone: statusTone(check.status),
  }));
}

/**
 * The plan, in order, as the lines the review screen shows.
 *
 * @param {Array<{ id: string, title: string, detail: string }>} plan
 * @param {{ dryRun?: boolean, danger?: boolean, limit?: number }} [options]
 * @returns {Array<{ text: string, tone?: string, bold?: boolean }>}
 */
export function reviewLines(plan, { dryRun = false, danger = false, limit = 40 } = {}) {
  const rows = plan.slice(0, limit).map((task, index) => ({
    text: `${String(index + 1).padStart(2)}. ${task.title}${task.detail ? `  ${task.detail}` : ""}`,
  }));
  const hidden = plan.length - rows.length;
  const warning = dryRun
    ? { text: "Dry run - nothing will be written. Press d to arm it for real.", tone: "info" }
    : { text: `Live run - ${plan.length} step(s) will change this machine. Press d for a dry run.`, tone: danger ? "fail" : "warn" };

  return [...rows, ...(hidden > 0 ? [{ text: `    ${hidden} more`, tone: "muted" }] : []), { text: "" }, warning];
}

/**
 * One line per task, for the run and for the closing summary.
 *
 * @param {Array<{ id: string, title: string, status: string, summary: string }>} results
 * @returns {Array<{ text: string, tone: string, bold?: boolean }>}
 */
export function progressRows(results) {
  return results.map((task) => ({
    text: `${task.status === "running" ? GLYPHS.spinner[0] : statusStyle(task.status).glyph} ${task.title}${task.summary ? ` - ${task.summary}` : ""}`,
    tone: statusTone(task.status),
    bold: task.status === "running",
  }));
}

/** The `ok 6 · warn 1` line. */
export function tallyLine(counts) {
  return ["ok", "warn", "fail", "skip"]
    .filter((status) => counts[status] > 0)
    .map((status) => `${statusStyle(status).glyph} ${counts[status]} ${status}`)
    .join("   ");
}

/**
 * The closing screen: the tally, whatever went wrong, and what to run next.
 *
 * Failures are listed with their message rather than a count. "2 warnings"
 * sends the user back to scroll the log; the message is the thing they need.
 *
 * @param {{ counts: object, results: object[], dryRun: boolean, nextSteps: string[] }} summary
 * @returns {{ heading: string, headingTone: string, lines: Array<{ text: string, tone?: string }> }}
 */
export function doneLines({ counts, results, dryRun, nextSteps }) {
  const problems = results.filter((task) => task.status === "fail" || task.status === "warn");

  return {
    heading: dryRun ? "Dry run complete" : counts.fail > 0 ? "Finished with failures" : "Complete",
    headingTone: counts.fail > 0 ? "fail" : "ok",
    lines: [
      { text: tallyLine(counts) },
      ...(problems.length > 0
        ? [{ text: "" }, ...problems.map((task) => ({ text: `${statusStyle(task.status).glyph} ${task.title}  ${task.summary}`, tone: statusTone(task.status) }))]
        : []),
      { text: "" },
      { text: "Next", tone: "accentSoft", bold: true },
      ...nextSteps.map((line) => ({ text: `-> ${line}`, tone: "muted" })),
    ],
  };
}

/**
 * The dimensions a manifest recorded, in catalog order.
 *
 * The doctor is excluded: it runs a check, it does not install anything to
 * remove, and offering it would be a tick whose removal does nothing.
 *
 * @param {object} [manifest]
 * @returns {string[]}
 */
export function installedDimensions(manifest) {
  const recorded = manifest?.dimensions ?? {};

  return DIMENSIONS.filter((dimension) => dimension !== "doctor" && recorded[dimension] === true);
}

/** The removal group a dimension maps onto, when it has one. */
const DIMENSION_GROUPS = { server: "agents", rules: "rules", commands: "commands", hooks: null, doctor: null };

/**
 * What the uninstall offers: every recorded dimension, plus the machine-level
 * leftovers the manifest does not track.
 *
 * Hooks have no group of their own: removing an agent takes its hook file with
 * it (see `uninstallAgent`), so a separate row would be a second promise for
 * the same file.
 *
 * @param {{ manifest?: object, groups?: Array<object> }} input
 * @returns {Array<{ id: string, label: string, note: string, detail: string[], count: number }>}
 */
export function uninstallItems({ manifest, groups = [] } = {}) {
  const byId = new Map(groups.map((group) => [group.id, group]));
  const recorded = installedDimensions(manifest);
  const fromManifest = recorded
    .map((dimension) => ({ dimension, group: byId.get(DIMENSION_GROUPS[dimension]) }))
    .filter((entry) => entry.group)
    .map(({ dimension, group }) => ({
      id: group.id,
      label: group.label,
      note: group.count > 0 ? `${group.count} recorded` : "nothing found",
      detail: [DIMENSION_DETAIL[dimension], "", ...(group.items.length > 0 ? group.items : ["Nothing to remove."])],
      count: group.count,
    }));
  const covered = new Set(fromManifest.map((item) => item.id));
  // A machine that never wrote a manifest still has things to remove, so the
  // scan is the fallback rather than a second, unrelated list.
  const fallback = recorded.length === 0 ? groups.filter((group) => group.count > 0) : [];
  const leftovers = [...fallback, ...groups]
    .filter((group, index, list) => list.indexOf(group) === index)
    .filter((group) => !covered.has(group.id) && group.id !== "agents")
    .filter((group) => group.count > 0)
    .map((group) => ({
      id: group.id,
      label: group.label,
      note: `${group.count}`,
      detail: [group.detail, "", ...group.items],
      count: group.count,
    }));

  return [...fromManifest, ...leftovers];
}

/** Purge targets as rows, with their file counts. */
export function purgeItems(targets) {
  return targets.map((target) => ({
    id: target.id,
    label: target.label,
    note: target.exists ? `${target.files} file(s)` : "absent",
    noteTone: target.exists ? "warn" : "muted",
    detail: [target.dir, "", target.exists ? "Deleted permanently. There is no backup." : "Nothing here to delete."],
    files: target.files,
  }));
}
