/**
 * @module cli/doctor/sections-agents
 *
 * The Agents section: which hosts answer, and how deep each one is wired.
 *
 * The depth line is the reason this is its own module: it reads the host record
 * for the ceiling and the manifest for the level, so the report states `L2 of L3,
 * next L3` instead of a number a reader cannot act on.
 */

import { color, section } from "../index.js";
import { hostRecord } from "../installers/hosts/index.js";

/**
 * The status glyph and tone for one detected host.
 *
 * @param {object} agent
 * @returns {{ glyph: string, tone: string }}
 */
export function agentIcon(agent) {
  if (!agent.configured) {
    return color("○", "dim");
  }

  return agent.validated === false ? color("⚠️", "yellow") : color("✅", "green");
}

/** Render a boolean as yes/no. */
export function yesNo(value) {
  return value ? color("yes", "green") : color("no", "red");
}

/** Truncate a value for one report line. */
export function truncate(value, max = 96) {
  const text = String(value ?? "");

  return text.length > max ? text.slice(0, max - 1) + "..." : text;
}

/**
 * How deep a configured host is wired, and the one rung it is missing next.
 *
 * The ceiling is what the host can reach; the level is what this machine has.
 * The report names the next rung it could install, because "L2 of L3" is a fact
 * a reader cannot act on, and "L2 of L3, next L3 (the hooks)" is.
 */
const depthLine = (id, installed) => {
  const record = hostRecord(id);

  if (!record) {
    return "";
  }

  if (!installed) {
    return color(`  ceiling ${record.ceiling}, depth not recorded (installed before the manifest knew)`, "dim");
  }

  const next = ["L1", "L2", "L3", "L4"].find((rung) => Number(rung.slice(1)) > Number(String(installed).slice(1)) && record.levels[rung].supported);

  return color(`  ${installed} of ${record.ceiling}${next ? `, next ${next}` : ""}`, "dim");
};

/** The Agents section: configured rows, an overflow note, and a missing-agents note. */
export function agentsSection(report) {
  const configuredAgents = (report.agents || []).filter((agent) => agent.configured);
  const missingAgents = (report.unconfigured || []).slice(0, 10);
  const lines = [section("Agents", "🤖"), `Configured:  ${color(report.agentsConfigured, "green")}/${report.agentsTotal}`];

  for (const agent of configuredAgents.slice(0, 12)) {
    lines.push(
      `  ${agentIcon(agent)} ${color(agent.name.padEnd(12), agent.validated === false ? "yellow" : "bold")} ${color(truncate(agent.configFile || "", 90), "dim")}${depthLine(agent.name, report.levels?.[agent.name])}`,
    );
  }

  if (configuredAgents.length > 12) {
    lines.push(color(`  ... ${configuredAgents.length - 12} more configured agents`, "dim"));
  }

  if (missingAgents.length > 0) {
    lines.push(
      `⚠️  ${color("Missing", "yellow")}: ${missingAgents.map((agent) => color(agent, "yellow")).join(", ")}${(report.unconfigured || []).length > missingAgents.length ? color(", ...", "dim") : ""}`,
    );
  }

  return lines;
}
