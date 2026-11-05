/**
@module core/secrets/report

Reading the findings out of a betterleaks report document.

The document is `{ schema_version, findings: [...], ...metadata }`. The bare
array an older build wrote is read too, because a report the gate cannot
recognize is a scan that did not happen, and the gate would have to report it
as one - better to read both shapes than to refuse a report that is fine.

A finding keeps rule, description, confidence, path and line. The match value
is dropped here and never travels further: it is the one field that must not
reach a hook log or a commit message.
*/

/**
One report entry, reduced to what a gate message can print.

@param {object} entry
@returns {{ ruleId: string, description: string, confidence: string, path: string, line: number }}
*/
function toFinding(entry) {
  return {
    ruleId: String(entry?.rule_id ?? "unknown"),
    description: String(entry?.description ?? ""),
    confidence: String(entry?.confidence ?? ""),
    path: String(entry?.location?.path ?? ""),
    line: Number(entry?.location?.start_line) || 0,
  };
}

/**
Read the findings out of a report document.

Throws on anything that is not a report: an unreadable document is a scan
that did not happen, and returning `[]` for it would report a clean patch
that was never read.

@param {string} stdout
@returns {Array<object>}
*/
export function parseReport(stdout = "") {
  let parsed;

  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error("betterleaks wrote an unparseable report");
  }

  if (parsed?.scan?.state === "incomplete") {
    throw new Error("betterleaks reported an incomplete scan; retry before accepting the result");
  }

  const findings = Array.isArray(parsed) ? parsed : parsed?.findings;

  if (!Array.isArray(findings)) {
    throw new TypeError("betterleaks wrote an unparseable report: no findings array");
  }

  return findings.map(toFinding);
}
