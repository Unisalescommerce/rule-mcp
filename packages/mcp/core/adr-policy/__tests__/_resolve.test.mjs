/** ADR policy resolution: first source wins whole; aliases; per-category override. */
import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-adr-policy-"));
const project = join(home, "repo");

process.env.HOME = home;
process.env.RULE_MCP_HOME = join(home, ".rule-mcp");
delete process.env.RULE_MCP_ADR_POLICY;

mkdirSync(project, { recursive: true });
mkdirSync(join(home, ".rule-mcp", "config"), { recursive: true });

test.after(() => {
  delete process.env.RULE_MCP_ADR_POLICY;
  rmSync(home, { recursive: true, force: true });
});

const { resolveAdrPolicy, allowsAdrWrite, normalizeLevel } = await import("../_resolve.js");
const { POLICY_ENV, POLICY_FILE } = await import("../_words.data.js");

test("default policy is handoff with empty categories", () => {
  const policy = resolveAdrPolicy({ projectDir: project, env: {}, homeDir: join(home, ".rule-mcp") });

  assert.equal(policy.default, "handoff");
  assert.deepEqual(policy.categories, {});
  assert.equal(policy.source, "default");
});

test("aliases map decision to full and off to on-demand", () => {
  assert.equal(normalizeLevel("decision"), "full");
  assert.equal(normalizeLevel("off"), "on-demand");
  assert.equal(normalizeLevel("FULL"), "full");
});

test("env level string wins over the saved env.json", () => {
  writeFileSync(
    join(home, ".rule-mcp", "config", "env.json"),
    `${JSON.stringify({ [POLICY_ENV]: "full" }, null, 2)}\n`,
  );

  const policy = resolveAdrPolicy({
    projectDir: project,
    env: { [POLICY_ENV]: "on-demand" },
    homeDir: join(home, ".rule-mcp"),
  });

  assert.equal(policy.default, "on-demand");
  assert.equal(policy.source, "env");
});

test("env JSON can set default and per-category overrides", () => {
  const policy = resolveAdrPolicy({
    projectDir: project,
    env: {
      [POLICY_ENV]: JSON.stringify({ default: "handoff", categories: { dependency: "full" } }),
    },
    homeDir: join(home, ".rule-mcp"),
  });

  assert.equal(policy.default, "handoff");
  assert.equal(policy.categories.dependency, "full");
  assert.equal(allowsAdrWrite(policy, { category: "dependency", moment: "task" }), true);
  assert.equal(allowsAdrWrite(policy, { category: "api", moment: "task" }), false);
  assert.equal(allowsAdrWrite(policy, { category: "api", moment: "handoff" }), true);
});

test("nearest .context/adr.json wins over env", () => {
  const nested = join(project, "packages", "app");

  mkdirSync(join(nested, ".context"), { recursive: true });
  writeFileSync(join(nested, ".context", "adr.json"), `${JSON.stringify({ default: "full" })}\n`);

  const policy = resolveAdrPolicy({
    projectDir: nested,
    env: { [POLICY_ENV]: "on-demand" },
    homeDir: join(home, ".rule-mcp"),
  });

  assert.equal(policy.default, "full");
  assert.equal(policy.source, POLICY_FILE);
  assert.equal(allowsAdrWrite(policy, { moment: "task" }), true);
});

test("saved env.json is used when env and project file are absent", () => {
  rmSync(join(project, "packages"), { recursive: true, force: true });
  writeFileSync(
    join(home, ".rule-mcp", "config", "env.json"),
    `${JSON.stringify({ [POLICY_ENV]: "full" }, null, 2)}\n`,
  );

  const policy = resolveAdrPolicy({
    projectDir: project,
    env: {},
    homeDir: join(home, ".rule-mcp"),
  });

  assert.equal(policy.default, "full");
  assert.equal(policy.source, "env.json");
});
