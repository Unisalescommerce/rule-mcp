/**
 * @module tools/stats-append
 *
 * Extra sections appended to the rule_tool_stats text body.
 */

import { formatBytes, graphAgeSeconds, graphStatus, runtimeSnapshot } from "../../core/tokensave/_insights.js";
import { tokensaveGain } from "../../core/tokensave/_ledger.js";
import { readRollups } from "../../core/telemetry/store/index.js";

/**
 * Append rollup / TokenSave / graph sections onto the stats text.
 *
 * @param {string} text
 * @param {string} scope
 * @returns {string}
 */
export function appendStatsExtras(text, scope) {
  let out = text;

  if (scope === "all") {
    const rollups = readRollups();

    if (rollups.length > 0) {
      const totals = { calls: 0, savedTokens: 0, estimatedTokens: 0 };

      for (const day of rollups) {
        totals.calls += day.calls ?? 0;
        totals.savedTokens += day.savedTokens ?? 0;
        totals.estimatedTokens += day.estimatedTokens ?? 0;
      }

      out += [
        "",
        "## Archived days",
        "",
        `${rollups.length} day(s) rolled up beyond the ${7}-day raw window:`,
        `  ${totals.calls} calls, ~${totals.savedTokens} tokens measured, ~${totals.estimatedTokens} estimated`,
        "",
      ].join("\n");
    }
  }

  const gain = tokensaveGain(process.cwd());

  if (gain) {
    out += [
      "",
      "## TokenSave ledger",
      "",
      `${gain.calls ?? 0} TokenSave calls over ${gain.range ?? "30d"} saved ~${gain.saved_tokens ?? 0} tokens${Number.isFinite(gain.usd) ? ` ($${gain.usd})` : ""}.`,
      "",
    ].join("\n");
  }

  const status = graphStatus(process.cwd());

  if (status) {
    const age = graphAgeSeconds(status);
    const runtime = runtimeSnapshot(process.cwd());
    const lines = [
      "",
      "## TokenSave graph",
      "",
      `${status.files} file(s), ${status.nodes} node(s), ${status.edges} edge(s); index ${formatBytes(status.dbBytes)} for ${formatBytes(status.sourceBytes)} of source.`,
      `Index last updated ${age === null ? "at an unknown time" : `${age}s ago`}.`,
    ];

    if (runtime) {
      lines.push(`Server pid ${runtime.pid ?? "?"} on TokenSave ${runtime.version}: ${formatBytes(runtime.rssBytes)} resident, ${runtime.cpuPercent}% cpu.`);
    }

    out += [...lines, ""].join("\n");
  }

  return out;
}
