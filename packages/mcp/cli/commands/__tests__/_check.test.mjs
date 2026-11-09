/**
`rule-mcp check`: the guardrails as a gate a script can call
(docs/adr/_pending/rule-mcp-check-runs-the-guardrails-on-changed-staged-or-named-files.md).

Three exits: 0 no `block` finding, 1 at least one, 2 the check did not run. A
check that did not run must never read as a clean one. The JSON is an array of
`{ skill, rule, severity, file, detail, suggestion }`.
*/
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { cleanUp, repo, run } from "./_check.fixture.mjs";

test.after(cleanUp);

test("--changed finds a block finding in a modified file and an untracked one, and exits 1", async () => {
  const { cwd } = repo();

  try {
    writeFileSync(join(cwd, "supabase", "migrations", "001.sql"), "drop table a;\n");
    writeFileSync(join(cwd, "supabase", "migrations", "002.sql"), "-- TODO\ncreate table b (id int);\n");

    const { code, out } = await run({ changed: true, json: true, dir: cwd });
    const findings = JSON.parse(out);

    assert.equal(code, 1);
    assert.deepEqual(
      findings.map((finding) => [finding.file, finding.rule, finding.severity, finding.skill]),
      [
        ["supabase/migrations/001.sql", "no-drop", "block", "house-migrations"],
        ["supabase/migrations/002.sql", "no-todo", "warn", "house-migrations"],
      ],
    );
    assert.deepEqual(Object.keys(findings[0]).sort(), ["detail", "file", "rule", "severity", "skill", "suggestion"]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("warnings alone exit 0", async () => {
  const { cwd } = repo();

  try {
    writeFileSync(join(cwd, "supabase", "migrations", "001.sql"), "-- TODO\n");

    const { code, out } = await run({ changed: true, dir: cwd });

    assert.equal(code, 0);
    assert.match(out, /warn\s+no-todo/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("--staged reads the index, and --files reads what it is given", async () => {
  const { cwd, git } = repo();

  try {
    writeFileSync(join(cwd, "supabase", "migrations", "001.sql"), "drop table a;\n");
    git("add", "-A");
    writeFileSync(join(cwd, "supabase", "migrations", "001.sql"), "create table a (id int);\n");

    assert.equal((await run({ staged: true, dir: cwd })).code, 1, "the staged bytes hold the drop");
    assert.equal((await run({ files: "supabase/migrations/001.sql", dir: cwd })).code, 0, "the working tree does not");

    const clean = await run({ changed: true, base: "HEAD", json: true, dir: cwd });

    assert.equal(clean.code, 0, "--changed reads the working tree, which matches the base again");
    assert.deepEqual(JSON.parse(clean.out), []);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("a check that cannot run exits 2", async () => {
  const outside = mkdtempSync(join(tmpdir(), "rule-check-nogit-"));

  try {
    assert.equal((await run({ dir: outside })).code, 2, "no file source chosen");
    assert.equal((await run({ changed: true, staged: true, dir: outside })).code, 2, "two file sources");
    assert.equal((await run({ changed: true, dir: outside })).code, 2, "not a git repository");
    assert.equal((await run({ files: "missing.ts", dir: outside })).code, 2, "a named file that is not there");
  } finally {
    rmSync(outside, { recursive: true, force: true });
  }
});
