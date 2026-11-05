/**
WS1-T2.1: a report the gate cannot read is a scan that did not happen.

Returning `[]` for an unparseable document would report a clean patch that
was never read, which is the one answer the gate must not give for free. Both
shapes are read - the v2 document and the bare array an older build wrote -
and anything else throws.
*/
import { strict as assert } from "node:assert";
import test from "node:test";

import { parseReport } from "@mcp/core/secrets/_report.js";

/** A v2 report document, trimmed to the fields the gate reads. */
const DOCUMENT = {
  schema_version: "2.0.0",
  findings: [
    {
      rule_id: "github-pat",
      description: "GitHub Personal Access Token",
      confidence: "high",
      match: { full: "ghp_****", value: "ghp_****" },
      location: { path: "src/config.ts", start_line: 12, end_line: 12 },
    },
  ],
};

test("a v2 document maps to the fields the gate reads", () => {
  const findings = parseReport(JSON.stringify(DOCUMENT));

  assert.deepEqual(findings, [{ ruleId: "github-pat", description: "GitHub Personal Access Token", confidence: "high", path: "src/config.ts", line: 12 }]);
});

test("a bare array is read too, so an older report is not a clean one", () => {
  const findings = parseReport(JSON.stringify(DOCUMENT.findings));

  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, "github-pat");
});

test("the match value never travels with the finding", () => {
  const [finding] = parseReport(JSON.stringify(DOCUMENT));

  assert.equal(JSON.stringify(finding).includes("ghp_"), false, "a hook log is not a place for a secret, redacted or not");
});

test("an unparseable report is an error, never an empty result", () => {
  assert.throws(() => parseReport("not json at all"), /unparseable/);
  assert.throws(() => parseReport(""), /unparseable/);
  assert.throws(() => parseReport(JSON.stringify({ schema_version: "2.0.0" })), /unparseable/);
});
