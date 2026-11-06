/**
 * @module test/docs/export-step8
 *
 * EX-10: env, privacy (session delete), surface map, and DM pointer to the
 * export-owned decision-cache stay aligned with what export shipped.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");

test("env table documents RULE_MCP_EXPORT_KEEP_SESSIONS", () => {
  const prose = read("../../../docs/10-env-variables.md");

  assert.match(prose, /RULE_MCP_EXPORT_KEEP_SESSIONS/);
  assert.match(prose, /newest|keep-set|session/i);
  assert.match(prose, /\b5\b/);
});

test("privacy documents confirm-gated hard-delete for /rule-export cleanup", () => {
  const privacy = read("../../../docs/11-privacy.md");

  assert.match(privacy, /rule-export\s+cleanup|\/rule-export\s+cleanup/i);
  assert.match(privacy, /hard.?delete|delete.*session/i);
  assert.match(privacy, /confirm/i);
  assert.match(privacy, /newest|keep-set|RULE_MCP_EXPORT_KEEP_SESSIONS/i);
  assert.match(privacy, /redact/i);
});

test("surface map lists export prompts on docs/21-surface-map.md", () => {
  const map = read("../../../docs/21-surface-map.md");

  assert.match(map, /rule-export/);
  assert.match(map, /rule-keep/);
  assert.match(map, /rule-adr/);
  assert.match(readFileSync(`${root}/docs/adr/190-close-out-plan-export.md`, "utf8"), /Close out plan _export/, "export plan closeout ADR 199 must exist after Step 8 handoff");
});

test("the decision-models record points durable choices at the export decision-cache", () => {
  const dm = read("../../../docs/adr/200-close-out-plan-decision-models.md");

  assert.match(dm, /decision-cache\.json/);
  assert.match(dm, /export-owned|export decision-cache/i);
  assert.match(dm, /durable/i);
});
