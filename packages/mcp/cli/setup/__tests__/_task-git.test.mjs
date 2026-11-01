/**
@module test/setup/task-git

The per-project git step: the pending-ADR landing hooks and the index merge
driver, written into the checkout the project install names. A root that is not
a repository is reported, not failed: a shared `.mcp.json` is useful outside git.

@see ADR 196 - number pending ADRs when they land on the trunk
*/

import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import "../../../../../tests/fixtures/git-hermetic.mjs";
import { projectGitRemovalTask, projectGitTask } from "../_task-git.js";

const git = (root, ...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

const repository = () => {
  const root = mkdtempSync(join(tmpdir(), "rule-task-git-"));

  git(root, "init", "--initial-branch=main", "-q");

  return root;
};

const bare = () => mkdtempSync(join(tmpdir(), "rule-task-git-bare-"));

test("a checkout gets the hooks, the driver and the tracked attributes", () => {
  const root = repository();

  try {
    const result = projectGitTask(root, "shared").run({ dryRun: false });
    const attributes = readFileSync(join(root, ".gitattributes"), "utf8");

    assert.equal(result.status, "ok");
    assert.equal(existsSync(join(root, ".githooks", "post-merge")), true, "the post-merge hook is written");
    assert.equal(existsSync(join(root, ".githooks", "post-rewrite")), true, "and post-rewrite");
    assert.match(attributes, /docs\/adr\/ADR\.md merge=rule-mcp-index/);
    assert.equal(git(root, "config", "merge.rule-mcp-index.driver"), "rule-mcp handoff merge-index %O %A %B %P");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a second run preserves what is already there", () => {
  const root = repository();

  try {
    projectGitTask(root, "shared").run({ dryRun: false });
    const second = projectGitTask(root, "shared").run({ dryRun: false });

    assert.match(second.summary, /0 written, 6 preserved/, second.summary);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a local project keeps the attributes private", () => {
  const root = repository();

  try {
    projectGitTask(root, "local").run({ dryRun: false });

    assert.equal(existsSync(join(root, ".gitattributes")), false, "nothing is tracked");
    assert.match(readFileSync(join(root, ".git", "info", "attributes"), "utf8"), /merge=rule-mcp-index/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a root that is not a repository is reported, not failed", () => {
  const root = bare();

  try {
    const result = projectGitTask(root, "shared").run({ dryRun: false });

    assert.equal(result.status, "ok");
    assert.match(result.summary, /not a git repository/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a dry run writes nothing", () => {
  const root = repository();

  try {
    projectGitTask(root, "shared").run({ dryRun: true });

    assert.equal(existsSync(join(root, ".githooks", "post-merge")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the removal takes the driver and the private attributes back", () => {
  const root = repository();

  try {
    projectGitTask(root, "local").run({ dryRun: false });
    const result = projectGitRemovalTask(root).run({ dryRun: false });

    assert.match(result.summary, /removed/);

    let driver = "";

    try {
      driver = git(root, "config", "merge.rule-mcp-index.driver");
    } catch {
      driver = "";
    }

    assert.equal(driver, "", "the driver is unset");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
