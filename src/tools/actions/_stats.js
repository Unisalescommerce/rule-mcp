/**
 * @module tools/stats
 *
 * `rule_tool_stats`: what this server has actually saved, read back from the
 * local telemetry log.
 *
 * The agreed read surfaces are a CLI command and this tool, and no local web
 * dashboard: a dashboard is a server to run and secure for a number a sentence
 * can carry.
 *
 * The one contract worth restating here, because this is where the numbers
 * become visible: measured savings and the routing estimate are reported as two
 * separate figures. Adding them would produce a bigger headline and a claim
 * nobody could defend.
 *
 * @see module:core/telemetry/stats - the aggregation
 * @see module:core/telemetry/store - the log
 */

import { readFileSync } from "node:fs";
import { z } from "zod/v4";
import { aggregate, renderFlight, renderStats } from "../../core/telemetry/stats/index.js";
import { graphStatus } from "../../core/tokensave/_insights.js";
import { readEvents, readMergedUsage } from "../../core/telemetry/store/index.js";
import { telemetryEnabled } from "../../core/telemetry/recorder/index.js";
import { registerTool } from "../router/index.js";
import { appendStatsExtras } from "./_stats-append.js";

const DAY_MS = 86_400_000;

/** Register the rule_tool_stats tool. */
export function registerStatsTool() {
  const StatsSchema = z.object({
    scope: z.enum(["session", "week", "all"]).default("week").describe("session|week|all"),
    flight: z.string().optional().describe("Path to a .flight file"),
  });

  registerTool({
    name: "rule_tool_stats",
    entry: "action",
    description: "Read the local telemetry log and summarize it: call counts, cache hit rate, saved/estimated tokens, latency.",
    zodSchema: StatsSchema,
    handler: async (arguments_) => {
      if (!telemetryEnabled()) {
        return {
          content: [{ type: "text", text: "Telemetry is disabled (RULE_MCP_NO_TELEMETRY=1). Nothing has been recorded." }],
        };
      }
      // An exported file is a closed recording window, so it is read as it is
      // and never mixed with whatever the live log has collected since.
      if (arguments_.flight) {
        try {
          const flight = JSON.parse(readFileSync(arguments_.flight, "utf8"));

          return {
            content: [{ type: "text", text: renderFlight(flight) }],
            _meta: { ruleFlight: flight.kpi },
          };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: "text", text: `Could not read ${arguments_.flight}: ${error.message}` }],
          };
        }
      }

      const scope = arguments_.scope ?? "week";
      const { sessionId } = await import("../../core/telemetry/recorder/index.js");
      let events = readEvents();

      if (scope === "session") {
        const current = sessionId();
        events = events.filter((event) => event.session === current);
      } else if (scope === "week") {
        const cutoff = Date.now() - 7 * DAY_MS;
        events = events.filter((event) => (event.ts ?? 0) > cutoff);
      }

      const stats = aggregate(events);
      const merged = readMergedUsage(process.cwd());
      const title = { session: "This session", week: "Last 7 days", all: "All recorded" }[scope];
      let text = renderStats(stats, { title: `rule-mcp telemetry: ${title}` });

      if (merged) {
        text += [
          "",
          "## Merged transcript usage",
          "",
          `${merged.agent ?? "agent"}: ${merged.apiCalls ?? 0} calls, ${merged.input ?? 0} in / ${merged.output ?? 0} out (digest ${(merged.digest ?? "").slice(0, 12)}...).`,
          "",
        ].join("\n");
      }

      text = appendStatsExtras(text, scope);
      const status = graphStatus(process.cwd());

      return {
        content: [{ type: "text", text }],
        _meta: { ruleStats: stats, ruleMergedUsage: merged ?? undefined, ruleGraph: status ?? undefined },
      };
    },
  });
}
