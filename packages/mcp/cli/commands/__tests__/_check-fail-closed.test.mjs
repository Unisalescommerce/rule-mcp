/**
`rule-mcp check` fails closed: a renamed file, an index git cannot read, a blob
the commit hook would skip, a project in a subdirectory and a rule id two
skills share must never turn a block finding into exit 0.
*/
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { cleanUp, repo, rule, run } from "./_check.fixture.mjs";

test.after(cleanUp);

test("--staged checks a renamed and edited file, and a git that fails is a check that did not run", async () => {
  const { cwd, git } = repo();
  const lines = "create table a (id int);\n".repeat(20);

  try {
    writeFileSync(join(cwd, "supabase", "migrations", "003.sql"), lines);
    git("add", "-A");
    git("commit", "-q", "-m", "more");
    git("mv", "supabase/migrations/003.sql", "supabase/migrations/004.sql");
    writeFileSync(join(cwd, "supabase", "migrations", "004.sql"), `${lines}drop table a;\n`);
    git("add", "-A");

    assert.match(execFileSync("git", ["diff", "--cached", "--name-status"], { cwd, encoding: "utf8" }), /^R/, "git sees a rename");
    assert.equal((await run({ staged: true, dir: cwd })).code, 1, "the renamed file is checked");

    writeFileSync(join(cwd, ".git", "index"), "not an index");

    assert.equal((await run({ staged: true, dir: cwd })).code, 2, "an unreadable index is not a clean one");
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("--staged checks a blob over the hook's 4 MiB read buffer instead of skipping it", async () => {
  const { cwd, git } = repo();

  try {
    writeFileSync(join(cwd, "supabase", "migrations", "001.sql"), `drop table a;\n${"-- pad\n".repeat(700_000)}`);
    git("add", "-A");

    assert.equal((await run({ staged: true, dir: cwd })).code, 1);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("a project in a subdirectory of its repository matches its globs on project-relative paths", async () => {
  const { cwd, git, top } = repo("pkg");

  try {
    writeFileSync(join(cwd, "supabase", "migrations", "001.sql"), "drop table a;\n");

    const changed = await run({ changed: true, json: true, dir: cwd });

    assert.equal(changed.code, 1, changed.err);
    assert.deepEqual(
      JSON.parse(changed.out).map((finding) => [finding.file, finding.rule]),
      [["supabase/migrations/001.sql", "no-drop"]],
    );

    git("add", "-A");

    const staged = await run({ staged: true, json: true, dir: cwd });

    assert.equal(staged.code, 1, staged.err);
    assert.deepEqual(
      JSON.parse(staged.out).map((finding) => [finding.file, finding.rule]),
      [["supabase/migrations/001.sql", "no-drop"]],
    );
  } finally {
    rmSync(top, { recursive: true, force: true });
  }
});

test("a rule id two skills share reports block when either skill grades it block", async () => {
  const { cwd } = repo();
  const skill = join(cwd, ".rule-mcp", "skills", "aa-advice");

  try {
    mkdirSync(join(skill, "guardrails"), { recursive: true });
    writeFileSync(join(skill, "SKILL.md"), '---\nname: aa-advice\npaths: ["supabase/**"]\nguardrails: [no-drop]\n---\n\n# advice\n');
    writeFileSync(join(skill, "guardrails", "index.js"), `export const GUARDRAILS = [${rule("no-drop", "drop table", "warn")}];\n`);
    writeFileSync(join(cwd, "supabase", "migrations", "001.sql"), "drop table a;\n");

    const { code, out } = await run({ files: "supabase/migrations/001.sql", json: true, dir: cwd });

    assert.equal(code, 1);
    assert.deepEqual(
      JSON.parse(out).map((finding) => [finding.rule, finding.severity, finding.skill]),
      [["no-drop", "block", "house-migrations"]],
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
