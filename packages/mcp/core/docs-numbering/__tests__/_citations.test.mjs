/**
`rewriteCitations`: every form a citation takes, in every tree that carries one.

ADR 219: the old rewrite covered markdown links under `docs/` only. A prose
`ADR 214` in `docs/plans/` and a `adr/214-slug.md` in `packages/` kept the old
number, so a reader followed a citation to a different decision. This covers
the three forms the tree actually uses, and reports a mention it could not
rewrite instead of leaving it silently behind.
*/
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { rewriteCitations } from "../index.js";

/** One rename, as `planRenumber` builds it. */
const RENAMES = [{ family: "ADR", fromNumber: "214", toNumber: "205", slug: "main-is-the-only-branch" }];

/**
 * A tree holding one file per citation form, plus a citation that must not move.
 *
 * @param {{ extra?: string }} [options]
 */
function seed({ extra } = {}) {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-citations-"));

  const files = {
    "docs/plans/plan.md": ["See [214](214-main-is-the-only-branch.md) and ADR 214.", "ADR 218 stays.", ""].join("\n"),
    "packages/mcp/thing.js": "/**\n * ADR 214 froze it. See adr/214-main-is-the-only-branch.md\n */\n",
    "skills/rule-x/SKILL.md": "This cites ADR 214/218 and nothing else.\n",
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

    assert.match(plan, /\[205\]\(205-main-is-the-only-branch\.md\)/u, "the link moves in label and target");
    assert.match(plan, /and ADR 205\./u, "the prose form moves");
    assert.match(plan, /ADR 218 stays\./u, "a citation the plan does not name stays");
    assert.match(code, /ADR 205 froze it/u, "the prose form moves in code");
    assert.match(code, /adr\/205-main-is-the-only-branch\.md/u, "the path form moves in code");
    assert.match(skill, /ADR 205\/218/u, "the paired form moves its first number only");
    assert.equal(result.filesUpdated, 3, "three files changed");
    assert.deepEqual(result.unresolved, [], "nothing was left behind");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a mention the rewrite does not own is reported, not ignored", () => {
  const root = seed({ extra: "The hyphenated form adr-214-old-slug is not one of the three.\n" });

  try {
    const result = rewriteCitations({ projectDir: root, renames: RENAMES });

    assert.equal(result.unresolved.length, 1, "one file still names the old number");
    assert.equal(result.unresolved[0].number, "214", "the report names the number");
    assert.match(result.unresolved[0].file, /docs\/odd\.md$/u, "the report names the file");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
