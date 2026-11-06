/**
`rewriteCitations`: every form a citation takes, in every tree that carries one.
 *
 * ADR 219: a citation that keeps an old number follows the wrong decision. The
 * rewrite covers the three forms the tree writes: the link, the path, and the
 * prose form.
 *
 * The numbers here are synthetic and built from `RENAMES`, because a literal
 * `ADR <three digits>` in this file would name a record that does not exist and
 * trip the corpus reference check.
 */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { rewriteCitations } from "../index.js";

/** One rename, as `planRenumber` builds it, on a number no real document holds. */
const RENAMES = [{ family: "ADR", fromNumber: "900", toNumber: "901", slug: "example-slug" }];

const FROM = RENAMES[0].fromNumber;
const TO = RENAMES[0].toNumber;
const KEEP = "918";
const PROSE_FROM = `ADR ${FROM}`;
const PROSE_TO = `ADR ${TO}`;
const PROSE_KEEP = `ADR ${KEEP}`;
const PATH_FROM = `${FROM}-example-slug.md`;
const PATH_TO = `${TO}-example-slug.md`;

/** The hyphenated form, built at runtime so this file is not a mention itself. */
const STRAY = ["adr", FROM, "old-slug"].join("-");

/**
 * A tree holding one file per citation form, plus a citation that must not move.
 *
 * @param {{ extra?: string }} [options]
 */
function seed({ extra } = {}) {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-citations-"));

  const files = {
    "docs/plans/plan.md": [`See [${FROM}](${PATH_FROM}) and ${PROSE_FROM}.`, `${PROSE_KEEP} stays.`, ""].join("\n"),
    "packages/mcp/thing.js": `/**\n * ${PROSE_FROM} froze it. See adr/${PATH_FROM}\n */\n`,
    "skills/rule-x/SKILL.md": `This cites ${PROSE_FROM}/${KEEP} and nothing else.\n`,
  };

  if (extra !== undefined) {
    files["docs/odd.md"] = extra;
  }

  for (const [path, body] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), body);
  }

  return root;
}

test("the link, the filename and the prose form all move", () => {
  const root = seed();

  try {
    const result = rewriteCitations({ projectDir: root, renames: RENAMES });
    const plan = readFileSync(join(root, "docs/plans/plan.md"), "utf8");
    const code = readFileSync(join(root, "packages/mcp/thing.js"), "utf8");
    const skill = readFileSync(join(root, "skills/rule-x/SKILL.md"), "utf8");

    assert.match(plan, new RegExp(`\\[${TO}\\]\\(${PATH_TO.replaceAll(".", "\\.")}\\)`, "u"), "the link moves in label and target");
    assert.match(plan, new RegExp(`and ${PROSE_TO}\\.`, "u"), "the prose form moves");
    assert.match(plan, new RegExp(`${PROSE_KEEP} stays\\.`, "u"), "a citation the plan does not name stays");
    assert.match(code, new RegExp(`${PROSE_TO} froze it`, "u"), "the prose form moves in code");
    assert.match(code, new RegExp(`adr/${PATH_TO.replaceAll(".", "\\.")}`, "u"), "the path form moves in code");
    assert.match(skill, new RegExp(`${PROSE_TO}/${KEEP}`, "u"), "the paired form moves its first number only");
    assert.equal(result.filesUpdated, 3, "three files changed");
    assert.deepEqual(result.unresolved, [], "nothing was left behind");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a test fixture keeps its numbers, because a fixture arranges them", () => {
  const root = seed();

  try {
    mkdirSync(join(root, "packages/mcp/core/__tests__"), { recursive: true });
    writeFileSync(join(root, "packages/mcp/core/__tests__/thing.test.mjs"), `// ${PROSE_FROM} and ${PATH_FROM} are arranged here\n`);

    const result = rewriteCitations({ projectDir: root, renames: RENAMES });
    const fixture = readFileSync(join(root, "packages/mcp/core/__tests__/thing.test.mjs"), "utf8");

    assert.match(fixture, new RegExp(`${PROSE_FROM} and ${PATH_FROM.replaceAll(".", "\\.")}`, "u"), "the fixture is untouched");
    assert.equal(result.filesUpdated, 3, "the three documents moved, the fixture did not");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a mention the rewrite does not own is reported, not ignored", () => {
  const root = seed({ extra: `The hyphenated form ${STRAY} is not one of the three.\n` });

  try {
    const result = rewriteCitations({ projectDir: root, renames: RENAMES });

    assert.equal(result.unresolved.length, 1, "one file still names the old number");
    assert.equal(result.unresolved[0].number, FROM, "the report names the number");
    assert.match(result.unresolved[0].file, /docs\/odd\.md$/u, "the report names the file");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
