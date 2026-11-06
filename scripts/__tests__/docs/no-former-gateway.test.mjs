/**
 * The former gateway left the runtime, and this keeps it from growing back.
 *
 * What the check skips, and why:
 * - `docs/adr/`, `docs/handoff/` and `CHANGELOG.md` are the record of what was
 *   decided, and a record that edits itself is not a record.
 * - `docs/plans/` are the work instructions that name the removal.
 * - `docs/case-studies/` holds demo applications whose lockfiles carry the
 *   three letters inside base64 hashes; the plan that retires them deletes the
 *   folder.
 *
 * The match is the name, not the substring: the three letters inside a base64
 * hash are not the project. This file is skipped because it has to spell the
 * name to search for it.
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SELF = ":(exclude)scripts/__tests__/docs/no-former-gateway.test.mjs";
const SKIPPED = [SELF, ":(exclude)docs/adr/**", ":(exclude)docs/handoff/**", ":(exclude)docs/plans/**", ":(exclude)docs/case-studies/**", ":(exclude)CHANGELOG.md"];

/** The name, wherever it is not part of a longer word. */
const NAME = "(^|[^A-Za-z0-9])nyx([^A-Za-z0-9]|$)";

test("the routing path calls no tier the gateway used to provide", () => {
  const read = (path) => readFileSync(join(root, path), "utf8");

  assert.doesNotMatch(read("packages/mcp/tools/ai/_register.js"), /nyx|rerankSkillScores/iu);
  assert.doesNotMatch(read("packages/mcp/tools/router/call/_stages.js"), /cacheLookupSemantic/u);
  assert.doesNotMatch(read("packages/mcp/core/cache/tool-cache/index.js"), /nyx/iu);
});

test("no tracked file outside the record names the former gateway", () => {
  let output = "";

  try {
    output = execFileSync("git", ["grep", "-inIE", NAME, "--", ".", ...SKIPPED], { cwd: root, encoding: "utf8" });
  } catch (error) {
    // git grep exits 1 when nothing matched, which is the pass.
    assert.equal(error.status, 1, `git grep failed: ${error.stderr ?? ""}`);
  }

  const hits = [
    ...new Set(
      output
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split(":", 1)[0]),
    ),
  ];

  assert.deepEqual(hits, [], `remove the name from these files, or move them under the record: ${hits.join(", ")}`);
});
