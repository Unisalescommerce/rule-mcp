/**
@module core/telemetry/export/distill

Distill pipeline for `/rule-export`: merge transcript usage, then emit a
`.flight`. Default is keep the MCP event log (distill-only); drain is opt-in
so re-running export cannot erase the recording by accident (EX-07).

@see docs/plans/_export.md Step 2
*/

import { promoteToolResults } from "../../export/promote/index.js";
import { exportFlight } from "../flight/index.js";
import { mergeTranscriptTelemetry } from "../store/index.js";

/**
 * Run one distill pass for a project.
 *
 * @param {{
 *   projectDir: string,
 *   home?: string,
 *   client?: string,
 *   since?: number,
 *   until?: number,
 *   exportedAt?: number,
 *   label?: string,
 *   keep?: boolean,
 *   drain?: boolean,
 *   redact?: boolean,
 *   toolCalls?: { tool: string, args?: object, result?: object }[],
 * }} options
 * @returns {{
 *   file: string,
 *   flight: object,
 *   calls: number,
 *   drained: number,
 *   kept: boolean,
 *   merge: object,
 *   promote: { promoted: number, skipped: { tool: string, reason: string }[] },
 * }}
 */
export function exportDistill(options = {}) {
  const { drain = false, keep, toolCalls, ...rest } = options;
  // Distill-only keeps the log. An explicit drain wins over keep; an explicit
  // keep:false without drain still drains, matching exportFlight's contract.
  const kept = !drain && keep !== false;

  const merge = mergeTranscriptTelemetry({
    projectDir: rest.projectDir,
    home: rest.home,
    client: rest.client,
    since: rest.since,
    until: rest.until,
  });

  const exported = exportFlight({ ...rest, keep: kept });
  // EX-09: only prime when the caller mined concrete calls; NON_CACHEABLE + cachePrime gate the rest.
  const promote = promoteToolResults(Array.isArray(toolCalls) ? toolCalls : []);

  return { ...exported, kept, merge, promote };
}
