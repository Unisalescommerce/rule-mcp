/**
 * @module test/plan-shape.test
 *
 * WS3 of docs/plans/_asd-ste100.md: AI-assisted development plans carry WSn /
 * WSn-Tx.y ids and a dual dependency graph (parseable list + diagram fence).
 * Persona trio checklists (ADR 59) are out of scope for this scanner.
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { DEVELOPMENT_PLAN_SHAPE_GUIDE, scanDevelopmentPlanShape } from "../plans/_shape.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

test("DEVELOPMENT_PLAN_SHAPE_GUIDE names WSn tasks and dual graph", () => {
  assert.match(DEVELOPMENT_PLAN_SHAPE_GUIDE, /WS\d+|WSn/);
  assert.match(DEVELOPMENT_PLAN_SHAPE_GUIDE, /WS\d+-T\d+|WSn-Tx/);
  assert.match(DEVELOPMENT_PLAN_SHAPE_GUIDE, /diagram|fenced/i);
  assert.match(DEVELOPMENT_PLAN_SHAPE_GUIDE, /Depends on:|edge list|dependency/i);
  assert.ok(/^[ -~\n]*$/.test(DEVELOPMENT_PLAN_SHAPE_GUIDE), "guide is plain ASCII");
});

test("scanDevelopmentPlanShape fails without workstream ids or a diagram fence", () => {
  const bare = [
    "# bare plan",
    "",
    "Status: `planned`",
    "",
    "## Dependency graph",
    "",
    "Depends on: none",
    "",
    "Feeds: none",
    "",
    "Shared files: none",
    "",
    "- [ ] Do the thing",
    "",
  ].join("\n");

  const result = scanDevelopmentPlanShape(bare);
  assert.equal(result.ok, false);
  assert.ok(result.findings.some((finding) => finding.id === "workstream"));
  assert.ok(result.findings.some((finding) => finding.id === "diagram"));
});

test("scanDevelopmentPlanShape passes a WSn plan with edge list and diagram", () => {
  const good = [
    "# shaped plan",
    "",
    "Status: `planned`",
    "",
    "## Dependency graph",
    "",
    "```",
    "WS1 --> WS2",
    "```",
    "",
    "Depends on: none",
    "",
    "Feeds: none",
    "",
    "Shared files: none",
    "",
    "- [plan-of-plans](plan-of-plans.md)",
    "",
    "### WS1 — Setup",
    "",
    "- [ ] **WS1-T1** Create the module",
    "  - [ ] WS1-T1.1 Add the test",
    "",
  ].join("\n");

  const result = scanDevelopmentPlanShape(good);
  assert.equal(result.ok, true, JSON.stringify(result.findings));
  assert.deepEqual(result.findings, []);
});

test("scripts/__tests__/fixtures/plans/development-shape-golden.md is a golden development-plan fixture", () => {
  const text = readFileSync(join(root, "scripts/__tests__/fixtures/plans/development-shape-golden.md"), "utf8");
  const result = scanDevelopmentPlanShape(text);
  assert.equal(result.ok, true, JSON.stringify(result.findings));
});

test("operation / persona plan guidance embeds the development-plan shape", async () => {
  const { fillRoleTemplate } = await import("../review/template/index.js");
  const { personaBody } = await import("../agents/commands/_personas.js");
  const filled = fillRoleTemplate(
    {
      id: "security",
      role: "Security Engineer",
      version: 1,
      yearsOfExperience: 10,
      skills: ["threat modeling"],
      lenses: ["authn"],
      evidenceSkills: ["rule-backend-security"],
    },
    { operation: "plan" },
  );

  assert.match(filled, /WS\d+-T|WSn|workstream/i);
  assert.match(filled, /diagram|Dependency graph/i);
  assert.match(personaBody({ role: "security", roleName: "Security Engineer" }), /WS\d+-T|WSn|workstream/i);
});
