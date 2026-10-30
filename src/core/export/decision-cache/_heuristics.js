/**
@module core/export/decision-cache/heuristics

Flag decisions that need an export interview before they enter the cache as
confirmed (Step 4.1).
*/

const ADR_TOOLS = new Set(["rule_tool_process_adr"]);
const MARKER = /\b(KEEP|REJECT|CONFIRM)\b/u;

/**
 * @param {{
 *   events?: Array<{ tool?: string }>,
 *   candidates?: Array<{ fingerprint?: string, choice?: unknown }>,
 *   text?: string,
 * }} [input]
 * @returns {Array<{ reason: string, detail?: string }>}
 */
export function flagDubious({ events = [], candidates = [], text = "" } = {}) {
  const flags = [];

  for (const event of events) {
    if (ADR_TOOLS.has(event.tool)) {
      flags.push({ reason: "adr-write", detail: event.tool });
    }
  }

  const byFingerprint = new Map();

  for (const candidate of candidates) {
    if (!candidate.fingerprint) {
      continue;
    }

    const prior = byFingerprint.get(candidate.fingerprint);

    if (prior !== undefined && JSON.stringify(prior) !== JSON.stringify(candidate.choice)) {
      flags.push({ reason: "conflict", detail: candidate.fingerprint });
    }

    byFingerprint.set(candidate.fingerprint, candidate.choice);
  }

  if (MARKER.test(text)) {
    flags.push({ reason: "explicit-marker" });
  }

  return flags;
}
