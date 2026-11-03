/**
@module test/adr-rules

The six `rule-process-adr` rules against the versioned trees and the legacy
list. Each tree proves one failure mode; the list proves the repository's own
history is excused only where it is still broken.

@see test/fixtures/adr - the trees
@see scripts/data/adr-legacy.data.mjs - the list that only shrinks
*/

import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { checkCode, setSkillGuardrails } from "../../../../packages/mcp/core/guardrails/index.js";
import { loadLayerGuardrails } from "../../../../packages/mcp/core/layers/_guardrails.js";
import { ADR_LEGACY } from "../../../../scripts/data/adr-legacy.data.mjs";

const SKILL = "rule-process-adr";
const RULES = ["adr-file-naming", "adr-status-vocabulary", "adr-author-line", "adr-ends-when", "adr-index-derived", "adr-english"];
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const trees = join(root, "scripts", "__tests__", "fixtures", "adr");

const LAYERED = await loadLayerGuardrails();

setSkillGuardrails(LAYERED);

/** The rule ids the skill's own layer resolves. */
function skillRuleIds() {
  return new Set((LAYERED.get(SKILL)?.guardrails ?? []).map((rule) => rule.id));
}

test("the skill declares every rule the corpus names", () => {
  const ids = skillRuleIds();
  const missing = RULES.filter((id) => !ids.has(id));

  assert.deepEqual(missing, [], `rule not found: ${missing.join(", ")}`);
});

/** One tree as a check context: its record, and the index only where the tree carries one. */
function tree(name) {
  const dir = join(trees, name);
  const files = readdirSync(dir).filter((file) => file.endsWith(".md") && file !== "README.md");
  const record = files.find((file) => file !== "ADR.md");
  const hasIndex = files.includes("ADR.md");
  const index = hasIndex ? readFileSync(join(dir, "ADR.md"), "utf8") : "";

  return {
    code: readFileSync(join(dir, record), "utf8"),
    context: hasIndex
      ? {
          fileName: record,
          fileList: files.filter((file) => file !== "ADR.md"),
          indexRows: [...index.matchAll(/\]\(([^)]+\.md)\)/g)].map((match) => match[1]),
        }
      : { fileName: record },
  };
}

const CASES = [
  ["clean", []],
  ["bad-slug", ["adr-file-naming"]],
  ["bad-status", ["adr-status-vocabulary"]],
  ["orphan-superseded", ["adr-status-vocabulary"]],
  ["placeholder-ends-when", ["adr-ends-when"]],
  ["index-drift", ["adr-index-derived"]],
];

test("each tree fails exactly the rule it exists to prove", () => {
  const offenders = [];

  for (const [name, expected] of CASES) {
    const { code, context } = tree(name);
    const failed = checkCode(SKILL, code, context)
      .failed.filter((item) => RULES.includes(item.id))
      .map((item) => item.id);

    if (failed.sort().join(",") !== expected.sort().join(",")) {
      offenders.push(`${name}: expected [${expected.join(", ")}], got [${failed.join(", ")}]`);
    }
  }

  assert.deepEqual(offenders, [], `fix these trees or rules:\n  ${offenders.join("\n  ")}`);
});

test("the legacy list only shrinks", () => {
  const offenders = [];

  for (const [rule, numbers] of Object.entries(ADR_LEGACY)) {
    for (const number of numbers) {
      const file = readdirSync(join(root, "docs", "adr")).find((name) => name.startsWith(`${number}-`));

      if (!file) {
        offenders.push(`${rule}: ${number} no longer exists`);
        continue;
      }

      const failed = checkCode(SKILL, readFileSync(join(root, "docs", "adr", file), "utf8"), { fileName: file }).failed.some((item) => item.id === rule);

      if (!failed) {
        offenders.push(`${rule}: ${number} passes now, delete it from the list`);
      }
    }
  }

  assert.deepEqual(offenders, [], offenders.join("\n"));
});
