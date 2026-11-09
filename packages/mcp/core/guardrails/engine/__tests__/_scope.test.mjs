/**
 * Where a skill applies and how hard its rules stop a check
 * (docs/adr/_pending/a-skill-names-its-paths-and-a-rule-its-severity.md):
 * `paths` in the frontmatter routes a file to the skill, and a rule with
 * `severity: "warn"` reports without failing the check.
 */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-scope-home-"));
const root = mkdtempSync(join(tmpdir(), "rule-scope-project-"));

process.env.RULE_MCP_HOME = home;
mkdirSync(join(root, ".git"), { recursive: true });

const { parseSkillFrontmatter } = await import("../../../skills/_frontmatter.js");
const { loadLayerGuardrails } = await import("../../../layers/_guardrails.js");
const { setSkillGuardrails } = await import("../_registry.js");
const { checkCode } = await import("../_check.js");
const { setSkillPaths, skillsForGlobs } = await import("../_scope.js");

test.after(() => {
  setSkillPaths(new Map());
  rmSync(home, { recursive: true, force: true });
  rmSync(root, { recursive: true, force: true });
});

/** Write a project skill with the given frontmatter lines and rule sources. */
function skill(name, lines, rules) {
  const dir = join(root, ".rule-mcp", "skills", name);

  mkdirSync(join(dir, "guardrails"), { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), `---\nname: ${name}\n${lines.join("\n")}\n---\n\n# ${name}\n`);
  writeFileSync(join(dir, "guardrails", "index.js"), `export const GUARDRAILS = [${rules.join(", ")}];\n`);
}

const rule = (id, extra = "") => `{ id: "${id}", label: "${id}", ${extra} check: () => ({ pass: false, failCount: 1, detail: ["${id}"], suggestion: "fix ${id}" }) }`;

test("paths and severity parse from the frontmatter, inline or as a block", () => {
  const inline = parseSkillFrontmatter('---\nname: a\npaths: ["supabase/migrations/**", "db/*.sql"]\nseverity: warn\n---\n');
  const block = parseSkillFrontmatter("---\nname: b\npaths:\n  - src/**/*.ts\n---\n");

  assert.deepEqual(inline.paths, ["supabase/migrations/**", "db/*.sql"]);
  assert.equal(inline.severity, "warn");
  assert.deepEqual(block.paths, ["src/**/*.ts"]);
  assert.equal(block.severity, undefined, "no severity means the default, which is block");
});

test("a skill's severity is the default of its rules, and a rule can say otherwise", async () => {
  skill("house-migrations", ["severity: warn", "guardrails: [mig-soft, mig-hard]"], [rule("mig-soft"), rule("mig-hard", 'severity: "block",')]);

  const loaded = await loadLayerGuardrails({ cwd: root });
  const rules = loaded.get("house-migrations").guardrails;

  assert.deepEqual(
    rules.map((entry) => [entry.id, entry.severity]),
    [
      ["mig-soft", "warn"],
      ["mig-hard", "block"],
    ],
  );
});

test("an unknown severity is reported and the rule blocks", async () => {
  skill("house-typo", ["severity: maybe", "guardrails: [typo-rule, typo-own]"], [rule("typo-rule"), rule("typo-own", 'severity: "soft",')]);

  const loaded = await loadLayerGuardrails({ cwd: root });

  assert.deepEqual(
    loaded.get("house-typo").guardrails.map((entry) => entry.severity),
    ["block", "block"],
  );
  assert.equal(loaded.problems.filter((problem) => problem.skill === "house-typo").length, 2, "both values are named");
});

test("a warn rule reports in advisory and does not fail the check", () => {
  setSkillGuardrails(new Map([["house-mixed", { inherits: [], guardrails: [{ ...evalRule("soft"), severity: "warn" }, evalRule("hard")] }]]));

  const report = checkCode("house-mixed", "x\n");

  assert.deepEqual(
    report.failed.map((entry) => [entry.id, entry.severity]),
    [["hard", "block"]],
  );
  assert.deepEqual(
    report.advisory.map((entry) => [entry.id, entry.severity]),
    [["soft", "warn"]],
  );
  assert.equal(report.advisoryCount, 1);
  assert.equal(report.failCount, 1, "only the block rule counts as a failure");

  setSkillGuardrails(new Map([["house-soft", { inherits: [], guardrails: [{ ...evalRule("soft"), severity: "warn" }] }]]));

  assert.equal(checkCode("house-soft", "x\n").allPass, true, "a check with only warnings passes");
});

test("paths route a file to the skills whose globs match it", () => {
  setSkillPaths(
    new Map([
      ["house-migrations", { paths: ["supabase/migrations/**"] }],
      ["house-ts", { paths: ["src/**/*.ts", "scripts/*.ts"] }],
      ["house-none", { paths: [] }],
    ]),
  );

  assert.deepEqual(skillsForGlobs("supabase/migrations/2026/001_init.sql"), ["house-migrations"]);
  assert.deepEqual(skillsForGlobs("src/lib/a.ts"), ["house-ts"]);
  assert.deepEqual(skillsForGlobs("README.md"), [], "a skill with no paths is routed by name only");
  assert.deepEqual(skillsForGlobs("./src/lib/a.ts"), ["house-ts"], "a leading ./ is the same path");
});

/** A rule object that always fails. */
function evalRule(id) {
  return { id, label: id, check: () => ({ pass: false, failCount: 1, detail: [id], suggestion: `fix ${id}` }) };
}
