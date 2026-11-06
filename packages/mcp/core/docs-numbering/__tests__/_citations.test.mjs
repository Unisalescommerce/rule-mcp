/**
`rewriteCitations`: every form a citation takes, in every tree that carries one.

ADR 219: the old rewrite covered markdown links under `docs/` only. A prose
`ADR 214` in `docs/plans/` and a `adr/214-slug.md` in `packages/` kept the old
number, so a reader followed a citation to a different decision. This covers
the three forms the tree actually uses, and reports a mention it could not
rewrite instead of leaving it silently behind.

The numbers here are synthetic. A test that cites a real ADR would be rewritten
by the very run it exercises, and would then assert against its own output.
*/
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { rewriteCitations } from "../index.js";

/** One rename, as `planRenumber` builds it, on a number no real document holds. */
const RENAMES = [{ family: "ADR", fromNumber: "900", toNumber: "901", slug: "example-slug" }];

/** The hyphenated form, built at runtime so this file is not a mention itself. */
const STRAY = ["adr", RENAMES[0].fromNumber, "old-slug"].join("-");

/**
 * A tree holding one file per citation form, plus a citation that must not move.
 *
 * @param {{ extra?: string }} [options]
 */
function seed({ extra } = {}) {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-citations-"));

  const files = {
    "docs/plans/plan.md": ["See [900](900-example-slug.md) and ADR 900.", "ADR 918 stays.", ""].join("\n"),
    "packages/mcp/thing.js": "/**\n * ADR 900 froze it. See adr/900-example-slug.md\n */\n",
    "skills/rule-x/SKILL.md": "This cites ADR 900/918 and nothing else.\n",
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

    assert.match(plan, /\[901\]\(901-example-slug\.md\)/u, "the link moves in label and target");
    assert.match(plan, /and ADR 901\./u, "the prose form moves");
    assert.match(plan, /ADR 918 stays\./u, "a citation the plan does not name stays");
    assert.match(code, /ADR 901 froze it/u, "the prose form moves in code");
    assert.match(code, /adr\/901-example-slug\.md/u, "the path form moves in code");
    assert.match(skill, /ADR 901\/918/u, "the paired form moves its first number only");
    assert.equal(result.filesUpdated, 3, "three files changed");
    assert.deepEqual(result.unresolved, [], "nothing was left behind");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a test fixture keeps its numbers, because a fixture arranges them", () => {
  const root = seed({ extra: undefined });

  try {
    mkdirSync(join(root, "packages/mcp/core/__tests__"), { recursive: true });
    writeFileSync(join(root, "packages/mcp/core/__tests__/thing.test.mjs"), "// ADR 900 and 900-example-slug.md are arranged here\n");

    const result = rewriteCitations({ projectDir: root, renames: RENAMES });
    const fixture = readFileSync(join(root, "packages/mcp/core/__tests__/thing.test.mjs"), "utf8");

    assert.match(fixture, /ADR 900 and 900-example-slug\.md/u, "the fixture is untouched");
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
    assert.equal(result.unresolved[0].number, RENAMES[0].fromNumber, "the report names the number");
    assert.match(result.unresolved[0].file, /docs\/odd\.md$/u, "the report names the file");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
