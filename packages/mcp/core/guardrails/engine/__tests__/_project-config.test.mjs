/**
 * The project's guardrail choices (docs/adr/_pending/a-project-chooses-its-guardrails-in-rule-mcp-config-json.md): `.rule-mcp/config.json` can
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

const { readGuardrailConfig, DEFAULT_GUARDRAIL_CONFIG } = await import("../_project-config.js");

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

test("no config file means the default: the full baseline and nothing disabled", () => {
  const root = project();

  try {
    const { config, problems } = readGuardrailConfig({ cwd: root });

    assert.deepEqual(config, DEFAULT_GUARDRAIL_CONFIG);
    assert.deepEqual(problems, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a valid file is read from the project root, also from a subdirectory", () => {
  const root = project({ guardrails: { baseline: "minimal", disable: ["jsdoc-required", "ai-no-emdash"] } });

  try {
    mkdirSync(join(root, "src", "deep"), { recursive: true });

    const { config, problems } = readGuardrailConfig({ cwd: join(root, "src", "deep") });

    assert.deepEqual(config, { baseline: "minimal", disable: ["jsdoc-required", "ai-no-emdash"] });
    assert.deepEqual(problems, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a broken file is reported and every rule still runs", () => {
  for (const body of ["{ not json", { guardrails: { baseline: "none" } }, { guardrails: { disable: "jsdoc-required" } }, { guardrails: [] }]) {
    const root = project(body);

    try {
      const { config, problems } = readGuardrailConfig({ cwd: root });

      assert.equal(config.baseline, "full", `fails toward more rules, not fewer: ${JSON.stringify(body)}`);
      assert.equal(problems.length, 1, `and says why: ${JSON.stringify(body)}`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("a disable list keeps its valid ids and reports the rest", () => {
  const root = project({ guardrails: { disable: ["jsdoc-required", 3, ""] } });

  try {
    const { config, problems } = readGuardrailConfig({ cwd: root });

    assert.deepEqual(config.disable, ["jsdoc-required"]);
    assert.equal(problems.length, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
