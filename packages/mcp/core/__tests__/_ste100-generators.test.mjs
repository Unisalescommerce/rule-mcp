/**
 * @module test/ste100-generators.test
 *
 * WS2 of docs/plans/_asd-ste100.md: every markdown-emitting surface this server
 * owns re-anchors the STE100~80 writing profile so agents fill prose correctly.
 */

import { strict as assert } from "node:assert";
import test from "node:test";

import * as ste100 from "../directive/_ste100.js";
import { personaBody } from "../agents/commands/_personas.js";
import { fillRoleTemplate } from "../review/template/index.js";
import { renderAudit, renderPlan, renderReview } from "../review/docs/_render.js";
import { HANDOFF_BODY, ADR_BODY } from "../agents/commands/_bodies-session.js";
import { resumePromptLines } from "../../tools/handoff/_sections-prompt.js";
import { adrEnglishOffenses } from "../../tools/adr/_english.js";
import { readFileSync } from "node:fs";

const { STE100_ANCHOR, STE100_WRITING_LINE, scanSte100Prose } = ste100;

const ROLE = {
  id: "security",
  role: "Security Engineer",
  version: 1,
  yearsOfExperience: 10,
  skills: ["threat modeling"],
  lenses: ["authn"],
  evidenceSkills: ["rule-backend-security"],
};

function assertsSte100Anchor(text, label) {
  assert.match(String(text), /STE100/, `${label} must name STE100`);
  assert.ok(
    String(text).includes(STE100_ANCHOR) || (STE100_WRITING_LINE && String(text).includes(STE100_WRITING_LINE)) || /ASD-STE100|STE100~80/.test(String(text)),
    `${label} must carry the shared STE100~80 wording`,
  );
}

test("STE100_WRITING_LINE is the shared embeddable instruction for generators", () => {
  assert.equal(typeof STE100_WRITING_LINE, "string");
  assert.match(STE100_WRITING_LINE, /STE100~80|ASD-STE100/);
  assert.match(STE100_WRITING_LINE, /short and actionable|actionable/i);
  assert.ok(/^[ -~]*$/.test(STE100_WRITING_LINE), "writing line is plain ASCII");
});

test("personaBody re-anchors STE100~80 for audit/review/plan prose", () => {
  const body = personaBody({ role: "security", roleName: "Security Engineer" });
  assertsSte100Anchor(body, "personaBody");
  assert.match(body, /short and actionable|actionable/i, "personaBody keeps findings short and actionable");
});

test("filled operation contract re-anchors STE100~80", () => {
  const filled = fillRoleTemplate(ROLE, { operation: "plan" });
  assertsSte100Anchor(filled, "fillRoleTemplate");
  assert.match(filled, /short and actionable|actionable/i, "operation contract keeps findings short");
});

test("trio render skeletons mention STE100~80", () => {
  const date = "2026-10-31";
  const findings = [{ id: "F1", severity: "high", status: "open", evidence: "audit#1", summary: "Missing rate limit." }];

  assertsSte100Anchor(renderAudit("security", 1, date), "renderAudit");
  assertsSte100Anchor(renderReview("security", 1, date, findings), "renderReview");
  assertsSte100Anchor(renderPlan("security", 1, date, findings), "renderPlan");
});

test("impersonation tool guidance re-anchors STE100~80", () => {
  const source = readFileSync(new URL("../../tools/actions/_impersonation.js", import.meta.url), "utf8");
  assertsSte100Anchor(source, "rule_tool_impersonation source");
  assert.match(source, /short and actionable|actionable/i);
});

test("handoff resume prompt and command bodies re-anchor STE100~80", () => {
  const resume = resumePromptLines({ projectName: "rule-mcp" }).join("\n");
  assertsSte100Anchor(resume, "resumePromptLines");
  assertsSte100Anchor(HANDOFF_BODY, "HANDOFF_BODY");
  assertsSte100Anchor(ADR_BODY, "ADR_BODY");
});

test("ADR English gate also rejects STE100 banned patterns", () => {
  const clean = adrEnglishOffenses({
    title: "Use PostgreSQL as the primary database",
    decision: "Adopt PostgreSQL 16 with pgbouncer.",
  });
  assert.deepEqual(clean, [], "clean English ADR stays clean");

  const utilize = adrEnglishOffenses({
    title: "Use a shared cache",
    decision: "Please utilize Redis for session storage.",
  });
  assert.ok(
    utilize.some((offense) => /utilize|STE100|ste100/i.test(offense)),
    "utilize is an ADR offense",
  );

  const emDash = adrEnglishOffenses({
    title: "Split the module",
    context: "The file is too large — split it.",
  });
  assert.ok(
    emDash.some((offense) => /em-dash|em dash|STE100|\\u2014|—/i.test(offense) || offense.includes("em-dash")),
    "em dash is an ADR offense",
  );
});

test("WS2 fixture prose from generators passes scanSte100Prose", () => {
  const date = "2026-10-31";
  const findings = [{ id: "F1", severity: "high", status: "open", evidence: "audit#1", summary: "Missing rate limit on login." }];
  const samples = [
    renderAudit("security", 1, date),
    renderReview("security", 1, date, findings),
    renderPlan("security", 1, date, findings),
    resumePromptLines({ projectName: "rule-mcp" }).join("\n"),
    personaBody({ role: "security", roleName: "Security Engineer" }),
  ];

  for (const sample of samples) {
    const scan = scanSte100Prose(sample);
    assert.equal(scan.ok, true, `fixture must pass STE100 scan: ${JSON.stringify(scan.findings)}`);
  }
});
