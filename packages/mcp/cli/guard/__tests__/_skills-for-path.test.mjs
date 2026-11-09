/**
 * A path-routed check sends a file to the skill its extension picks and to
 * every skill whose `paths` globs match it
 * (docs/adr/_pending/a-skill-names-its-paths-and-a-rule-its-severity.md).
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { setSkillPaths } from "../../../core/guardrails/index.js";
import { skillsForPath } from "../_route.js";
import { stagedFailures } from "../_staged.js";

test.afterEach(() => setSkillPaths(new Map()));

test("with no path skills, the extension alone decides, as before", () => {
  assert.deepEqual(skillsForPath("src/a.tsx"), ["rule-frontend-react"]);
  assert.deepEqual(skillsForPath("db/001.sql"), ["rule-data-sql"]);
  assert.deepEqual(skillsForPath("docs/notes.md"), [], "an extension the guardrails do not read routes nowhere");
});

test("a matching path skill is added, also for a file no extension routes", () => {
  setSkillPaths(
    new Map([
      ["house-migrations", { paths: ["supabase/migrations/**"] }],
      ["house-agents", { paths: ["AGENTS.md"] }],
    ]),
  );

  assert.deepEqual(skillsForPath("supabase/migrations/001_init.sql"), ["rule-data-sql", "house-migrations"]);
  assert.deepEqual(skillsForPath("AGENTS.md"), ["house-agents"]);
});

test("the commit gate checks a staged file against each skill it routes to", () => {
  const cwd = mkdtempSync(join(tmpdir(), "rule-paths-staged-"));
  const git = (...args) => execFileSync("git", ["-c", "core.hooksPath=/dev/null", ...args], { cwd, stdio: "pipe" });
  const seen = [];

  try {
    git("init", "-q");
    mkdirSync(join(cwd, "supabase", "migrations"), { recursive: true });
    writeFileSync(join(cwd, "supabase", "migrations", "001.sql"), "drop table a;\n");
    writeFileSync(join(cwd, "AGENTS.md"), "# rules\n");
    git("add", "-A");
    setSkillPaths(
      new Map([
        ["house-migrations", { paths: ["supabase/migrations/**"] }],
        ["house-agents", { paths: ["AGENTS.md"] }],
      ]),
    );

    const failures = stagedFailures({
      cwd,
      check: (skill) => {
        seen.push(skill);

        return { allPass: false, failed: [{ id: `${skill}-rule` }] };
      },
    });

    assert.deepEqual(seen.sort(), ["house-agents", "house-migrations", "rule-data-sql"]);
    assert.deepEqual(failures, [
      { file: "AGENTS.md", failures: ["house-agents-rule"] },
      { file: "supabase/migrations/001.sql", failures: ["rule-data-sql-rule", "house-migrations-rule"] },
    ]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
