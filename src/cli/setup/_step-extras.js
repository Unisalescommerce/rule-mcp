/**
 * @module cli/setup/step-extras
 *
 * Step 4: everything beyond the MCP entry itself.
 *
 * All of it is opt-in and each row says exactly which files it touches. The
 * shell installer wrote instruction files and slash commands by default and
 * asked about skills in a single y/N line; users could not see the blast
 * radius before agreeing to it.
 */

import { Box, Text, h } from "./_h.js";
import { COLORS } from "./_theme.js";
import { ListDetail } from "./_widget-list.js";
import { useSelection } from "./_use-selection.js";
import { hookSupport } from "../install/_hook-hosts.js";

/**
 * Every optional step, with the paths it writes.
 *
 * The two agent-scoped rows read their paths off the registries rather than
 * naming them in prose. The prose had drifted: it advertised `./CLAUDE.md`,
 * which no install writes, and left out `~/.pi/agent/AGENTS.md`, which one
 * does.
 *
 * @param {{ mode: string, agents?: string[], ruleFiles?: string[] }} options
 */
export function extraItems({ mode, agents = [], ruleFiles = [] }) {
  const forAgents = agents.length > 0 ? agents.join(", ") : "no agent selected";
  const hookable = agents.filter((agent) => hookSupport(agent).writable);

  return [
    {
      id: "rules",
      label: "Instruction rules",
      detail: [
        `Appends the rule-mcp workflow block for: ${forAgents}`,
        "",
        ...(ruleFiles.length > 0 ? ruleFiles : ["No instruction file on this machine yet."]),
        "",
        "Removable: the block is sentinel-delimited.",
      ],
    },
    {
      id: "commands",
      label: "Agent slash commands",
      detail: ["Writes the rule-mcp-* command files into the", `command directories of: ${forAgents}`],
    },
    {
      id: "hooks",
      label: "Guard hooks",
      detail:
        hookable.length > 0
          ? ["Writes the PreToolUse/PostToolUse guards for:", hookable.join(", "), "", "Only the selected agents are touched; hosts", "without a documented mechanism are skipped."]
          : ["No selected agent documents a hook", "mechanism - this step has nothing to write."],
      disabled: hookable.length === 0,
    },
    {
      id: "skills",
      label: "Bundled rule-mcp-* skills",
      detail: ["Copies the skill catalog to ~/.agents/skills.", "", "Not required: the server already serves skills", "from its embedded catalog."],
    },
    {
      id: "minimal",
      label: "Minimal tool surface",
      detail: [
        "Writes RULE_MCP_MINIMAL_TOOLS=1 into the",
        "server env, so the installed server exposes",
        "the 10 dispatcher tools instead of all 107.",
        "",
        "Off leaves the saved server config alone.",
      ],
    },
    {
      id: "service",
      label: "Platform daemon service",
      detail: mode === "daemon" ? ["Registers a LaunchAgent, systemd user unit,", "or Windows service that starts at login."] : ["Only applies in daemon mode."],
      disabled: mode !== "daemon",
    },
    {
      id: "doctor",
      label: "Health check",
      detail: ["Runs rule-mcp doctor at the end and", "shows the tail of its report."],
    },
  ];
}

/**
 * @param {{ items: object[], initial: string[], columns: number, onSubmit: Function, onBack: Function }} props
 */
export function StepExtras({ items, initial, columns, onSubmit, onBack }) {
  const { cursor, selected, current } = useSelection(items, { initial, onSubmit, onBack });

  return h(
    Box,
    { flexDirection: "column" },
    h(Text, { color: COLORS.accentSoft, bold: true }, "Optional steps"),
    h(ListDetail, { items, cursor, selected, current, height: 8, columns }),
  );
}
