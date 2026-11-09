/**
 * How the registry applies the project's guardrail choices (docs/adr/_pending/a-project-chooses-its-guardrails-in-rule-mcp-config-json.md): `.rule-mcp/config.json` can
 * stop the baseline skills riding along and can turn single rules off. With
 * no file, every rule runs exactly as before.
 */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-cfg-home-"));

process.env.RULE_MCP_HOME = home;

const { DEFAULT_GUARDRAIL_CONFIG, setGuardrailConfig } = await import("../_project-config.js");
const { getGuardrails, setSkillGuardrails, BASELINE_SKILLS } = await import("../_registry.js");
const { checkCode } = await import("../_check.js");

test.after(() => rmSync(home, { recursive: true, force: true }));

/** A scratch project, with `.rule-mcp/config.json` holding `body` when given. */
function project(body) {
  const root = mkdtempSync(join(tmpdir(), "rule-cfg-project-"));

  mkdirSync(join(root, ".rule-mcp"), { recursive: true });

  if (body !== undefined) {
    writeFileSync(join(root, ".rule-mcp", "config.json"), typeof body === "string" ? body : JSON.stringify(body));
  }

  return root;
}

/** One rule that always fails, owned by `owner`. */
const failing = (id) => ({ id, label: id, check: () => ({ pass: false, failCount: 1, detail: [id], suggestion: `fix ${id}` }) });

/** A registry with one baseline skill and one ordinary skill, each owning one failing rule. */
function install() {
  setSkillGuardrails(
    new Map([
      [BASELINE_SKILLS[0], { inherits: [], guardrails: [failing("base-rule")] }],
      ["rule-house", { inherits: [], guardrails: [failing("house-rule"), failing("house-other")] }],
    ]),
  );
}

test("the default config leaves getGuardrails as it was", () => {
  install();
  setGuardrailConfig(DEFAULT_GUARDRAIL_CONFIG);

  assert.deepEqual(
    getGuardrails("rule-house").map((rule) => rule.id),
    ["base-rule", "house-rule", "house-other"],
  );
});

test("baseline minimal stops the baseline riding along, and the named skill keeps its rules", () => {
  install();

  try {
    setGuardrailConfig({ baseline: "minimal", disable: [] });

    assert.deepEqual(
      getGuardrails("rule-house").map((rule) => rule.id),
      ["house-rule", "house-other"],
    );
    assert.deepEqual(
      getGuardrails(BASELINE_SKILLS[0]).map((rule) => rule.id),
      ["base-rule"],
      "a check that names a baseline skill still runs that skill",
    );
  } finally {
    setGuardrailConfig(DEFAULT_GUARDRAIL_CONFIG);
  }
});

test("a disabled rule is gone from every check, wherever it comes from", () => {
  install();

  try {
    setGuardrailConfig({ baseline: "full", disable: ["base-rule", "house-other"] });

    assert.deepEqual(
      getGuardrails("rule-house").map((rule) => rule.id),
      ["house-rule"],
    );

    const report = checkCode("rule-house", "const a = 1;\n");

    assert.deepEqual(
      report.failed.map((rule) => rule.id),
      ["house-rule"],
      "the check never runs what the project turned off",
    );
  } finally {
    setGuardrailConfig(DEFAULT_GUARDRAIL_CONFIG);
  }
});

test("installing the skill rules also installs the project's choices, and reports a broken file", async () => {
  const { installSkillGuardrails } = await import("../../../skills/_guardrail-layers.js");
  const root = project({ guardrails: { baseline: "minimal", disable: ["ts-no-explicit-any"] } });
  const broken = project("{ not json");

  try {
    await installSkillGuardrails({ cwd: root });

    const ids = new Set(getGuardrails("rule-frontend-react").map((rule) => rule.id));

    assert.ok(ids.has("react-no-classname"), "the named skill's own rules still run");
    assert.ok(!ids.has("ts-no-explicit-any"), "a disabled rule does not");
    assert.ok(!ids.has("ai-no-emdash"), "nor does a baseline rule under minimal");

    const { problems } = await installSkillGuardrails({ cwd: broken });

    assert.ok(
      problems.some((problem) => problem.layer === "project" && /not valid JSON/.test(problem.reason)),
      "a config that does not parse is named",
    );
    assert.ok(
      getGuardrails("rule-frontend-react").some((rule) => rule.id === "ai-no-emdash"),
      "and the full baseline is back",
    );
  } finally {
    setGuardrailConfig(DEFAULT_GUARDRAIL_CONFIG);
    rmSync(root, { recursive: true, force: true });
    rmSync(broken, { recursive: true, force: true });
  }
});
