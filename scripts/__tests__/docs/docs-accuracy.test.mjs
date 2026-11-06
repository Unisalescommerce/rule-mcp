/**
 * docs-accuracy.test.mjs
 *
 * The README advertises surface counts. This test computes the real surface at
 * runtime and fails whenever README.md disagrees.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const skillsRoot = fileURLToPath(new URL("../../../skills", import.meta.url));
const actual = {};
{
  const { loadAllSkills } = await import("../../../packages/mcp/core/skills/index.js");
  await loadAllSkills(true);
  const { bootstrapCoreTools } = await import("../../../packages/mcp/tools/_bootstrap.js");
  await bootstrapCoreTools();
  const { listTools } = await import("../../../packages/mcp/tools/router/index.js");
  const { listResources } = await import("../../../packages/mcp/resources/index.js");
  const { listPrompts } = await import("../../../packages/mcp/prompts/index.js");
  const { commandNames } = await import("../../../packages/mcp/core/agents/commands/index.js");
  const len = (r) => (Array.isArray(r) ? r.length : (r.tools ?? r.resources ?? r.prompts).length);
  actual.tools = len(await listTools({}));
  actual.resources = len(await listResources({}));
  actual.prompts = len(await listPrompts());
  actual.commands = commandNames().length;
  actual.skillDirs = readdirSync(new URL("../../../skills", import.meta.url).pathname, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && existsSync(join(skillsRoot, entry.name, "SKILL.md")),
  ).length;
  // The catalog prefix is `rule-`, not `rule-mcp-`: the skill directories were
  // renamed when the server became RuleMCP (ADR 169) and this counter was not, so
  // it read 0 against a README that said 83.
  actual.catalog = readdirSync(new URL("../../../skills", import.meta.url).pathname, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && entry.name.startsWith("rule-") && existsSync(join(skillsRoot, entry.name, "SKILL.md")),
  ).length;
}

const README = readFileSync(fileURLToPath(new URL("../../../README.md", import.meta.url)), "utf8");
const CLAUDE = readFileSync(fileURLToPath(new URL("../../../CLAUDE.md", import.meta.url)), "utf8");

/** What the skill layer says each skill owns, which is the guardrail surface. */
const guardrails = await (async () => {
  const { loadLayerGuardrails } = await import("../../../packages/mcp/core/layers/_guardrails.js");
  const { BASELINE_SKILLS, getGuardrails } = await import("../../../packages/mcp/core/guardrails/engine/_registry.js");
  const owned = await loadLayerGuardrails();
  const ids = new Set();
  let entries = 0;
  let skills = 0;

  for (const [, layer] of owned) {
    const rules = layer?.guardrails ?? [];
    skills += rules.length > 0 ? 1 : 0;
    entries += rules.length;

    for (const rule of rules) {
      ids.add(rule.id ?? rule.name);
    }
  }

  const baseline = new Set();

  for (const name of BASELINE_SKILLS) {
    for (const rule of getGuardrails(name) ?? []) {
      baseline.add(rule.id ?? rule.name);
    }
  }

  return { entries, skills, distinct: ids.size, baseline: baseline.size };
})();

test("README advertises the real tool count", () => {
  assert.match(README, new RegExp(`${actual.tools} tools`), `README must mention ${actual.tools} tools`);
});

test("README advertises the real resource count", () => {
  assert.match(README, new RegExp(`${actual.resources} resources`));
});

test("README advertises the real prompt count", () => {
  assert.match(README, new RegExp(`${actual.prompts} prompts`));
});

test("README advertises the catalog skill count", () => {
  assert.match(README, new RegExp(`${actual.catalog} skills`));
});

test("README advertises the slash command count", () => {
  assert.match(README, new RegExp(`${actual.commands} slash commands`));
});

test("CLAUDE.md advertises the same surface as the runtime", () => {
  const expected = [
    `${actual.tools} tools`,
    `${actual.resources} resources`,
    `${actual.prompts} prompts`,
    `${actual.catalog} skills`,
    `${guardrails.distinct} guardrail rules`,
    `${guardrails.skills} of the ${actual.skillDirs} skill directories`,
    `${guardrails.baseline} baseline rules`,
  ];

  const stale = expected.filter((claim) => !CLAUDE.includes(claim));

  assert.deepEqual(stale, [], `CLAUDE.md must state: ${expected.join(", ")}`);
});

test("generated-document headers name scripts that exist", () => {
  const header = readFileSync(fileURLToPath(new URL("../../../CHANGELOG.md", import.meta.url)), "utf8")
    .split("\n")
    .slice(0, 8)
    .join("\n");
  const missing = [...header.matchAll(/`((?:scripts|src|tests|docs|bin)\/[^`]*?)`/gu)]
    .map((match) => match[1])
    .filter((file, index, all) => all.indexOf(file) === index)
    .filter((file) => !existsSync(join(skillsRoot, "..", file)));

  assert.deepEqual(missing, [], "a header that names a missing script sends the next editor off disk");
});

console.log(
  `  ✅ README and CLAUDE.md match reality (${actual.tools} tools / ${actual.resources} resources / ${actual.prompts} prompts / ${actual.catalog} skills / ${actual.commands} commands / ${guardrails.distinct} guardrail rules in ${guardrails.skills} skills)`,
);
