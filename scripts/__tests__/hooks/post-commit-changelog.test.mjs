/**
 * @module scripts/__tests__/hooks/post-commit-changelog
 *
 * Every changelog entry carries the sha of its commit, so a commit can never
 * hold its own entry. The post-commit hook adds the entry in a second commit,
 * and it must stay out of the way everywhere else: a `chore` commit, a history
 * with no tag, a rebase, and whatever else is staged.
 */

import { strict as assert } from "node:assert";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HOOK = fileURLToPath(new URL("../../../.githooks/post-commit", import.meta.url));

/** Stands in for the real generator: one line per commit, so any commit is stale. */
const STUB = `import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const next = execFileSync("git", ["log", "--format=%h %s"], { encoding: "utf8" });

if (process.argv.includes("--check")) {
  process.exitCode = readFileSync("CHANGELOG.md", "utf8") === next ? 0 : 1;
} else {
  writeFileSync("CHANGELOG.md", next);
}
`;

/** A repository with the hook installed, one commit, and maybe a tag. */
function repository(t, { tagged = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-post-commit-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();

  t.after(() => rmSync(dir, { recursive: true, force: true }));
  git("init", "-q", "-b", "main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.org");
  // A machine can set a global hooks path, and git then ignores .git/hooks.
  git("config", "core.hooksPath", join(dir, ".git", "hooks"));
  mkdirSync(join(dir, "scripts", "build", "changelog"), { recursive: true });
  writeFileSync(join(dir, "scripts", "alias-hook.mjs"), "");
  writeFileSync(join(dir, "scripts", "build", "changelog", "index.mjs"), STUB);
  writeFileSync(join(dir, "CHANGELOG.md"), "");
  git("add", "-A");
  git("commit", "-q", "-m", "chore(seed): start");

  if (tagged) {
    git("tag", "-a", "v0.1.0", "-m", "v0.1.0");
  }

  cpSync(HOOK, join(dir, ".git", "hooks", "post-commit"));

  return { dir, git, count: () => Number(git("rev-list", "--count", "HEAD")) };
}

/** Commit one new file with this subject. */
function commit({ dir, git }, subject, file = "work.txt") {
  writeFileSync(join(dir, file), subject);
  git("add", file);
  git("commit", "-q", "-m", subject);
}

test("a docs commit gets a second commit that holds only the changelog", (t) => {
  const repo = repository(t);

  commit(repo, "docs(x): change");

  assert.equal(repo.count(), 3);
  assert.equal(repo.git("log", "-1", "--format=%s"), "chore(changelog): refresh");
  assert.equal(repo.git("show", "--name-only", "--format=", "HEAD"), "CHANGELOG.md");
  assert.equal(spawnSync("git", ["status", "--porcelain"], { cwd: repo.dir, encoding: "utf8" }).stdout, "");
});

test("work that stays staged stays out of the second commit", (t) => {
  const repo = repository(t);

  writeFileSync(join(repo.dir, "staged.txt"), "later");
  repo.git("add", "staged.txt");
  commit(repo, "feat(x): change");
  writeFileSync(join(repo.dir, "next.txt"), "more");
  repo.git("add", "next.txt");
  writeFileSync(join(repo.dir, "other.txt"), "x");
  repo.git("add", "other.txt");
  repo.git("commit", "-q", "-m", "fix(x): only this", "--", "other.txt");

  assert.equal(repo.git("show", "--name-only", "--format=", "HEAD"), "CHANGELOG.md");
  assert.match(repo.git("status", "--porcelain"), /A {2}next\.txt/u);
});

test("a chore commit, the release one among them, starts nothing", (t) => {
  const repo = repository(t);

  commit(repo, "chore(release): v0.2.0");

  assert.equal(repo.count(), 2);
});

test("before the first tag nothing is refreshed", (t) => {
  const repo = repository(t, { tagged: false });

  commit(repo, "feat(x): change");

  assert.equal(repo.count(), 2);
});

test("a rebase in progress is left alone", (t) => {
  const repo = repository(t);

  mkdirSync(join(repo.dir, ".git", "rebase-merge"));
  commit(repo, "fix(x): change");

  assert.equal(repo.count(), 2);
});

test("the test switch turns the hook off", (t) => {
  const repo = repository(t);

  process.env.RULE_MCP_HOOK_NO_SIDE_EFFECTS = "1";

  try {
    commit(repo, "docs(x): change");
  } finally {
    delete process.env.RULE_MCP_HOOK_NO_SIDE_EFFECTS;
  }

  assert.equal(repo.count(), 2);
});
