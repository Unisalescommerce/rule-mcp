/**
 * createdAt / addedBy must follow only real renames.
 *
 * git log --follow defaults to -M50%, so a new ADR built on the same template
 * inherits the deleted file's date and author. -M70% keeps template copies as
 * new files while still tracking genuine renames (~85%+).
 *
 * Fixtures were calibrated with `git diff -M --summary`: ~59% (below 70%) and
 * ~81% (above 70%).
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { addedBy, createdAt } from "../_git.js";

const JANUARY = "2026-01-15T12:00:00 +0000";
const FEBRUARY = "2026-02-15T12:00:00 +0000";
const JANUARY_TS = Math.floor(Date.parse("2026-01-15T12:00:00Z") / 1000);
const FEBRUARY_TS = Math.floor(Date.parse("2026-02-15T12:00:00Z") / 1000);

const lines = (count, prefix) => Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);

/** Ten common lines - the January original. */
const ORIGINAL = `${lines(10, "COMMON-").join("\n")}\n`;

/** ~59% similar: six common lines + four unique (calibrated below -M70%). */
const TEMPLATE_COPY = `${[...lines(6, "COMMON-"), ...lines(4, "OTHER-")].join("\n")}\n`;

/** ~81% similar: nine common lines + one tweak (calibrated above -M70%). */
const RENAMED = `${[...lines(9, "COMMON-"), "COMMON-10-tweaked"].join("\n")}\n`;

function git(cwd, args, env = {}) {
  execFileSync("git", args, {
    cwd,
    env: {
      ...process.env,
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_SYSTEM: "/dev/null",
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function commit(cwd, message, when, author) {
  git(cwd, ["-c", "core.hooksPath=/dev/null", "commit", "--no-verify", "-m", message], {
    GIT_AUTHOR_DATE: when,
    GIT_COMMITTER_DATE: when,
    GIT_AUTHOR_NAME: author.name,
    GIT_AUTHOR_EMAIL: author.email,
    GIT_COMMITTER_NAME: author.name,
    GIT_COMMITTER_EMAIL: author.email,
  });
}

function initRepo() {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-rename-"));
  const docs = join(root, "docs", "adr");

  mkdirSync(docs, { recursive: true });
  git(root, ["init"]);
  git(root, ["config", "user.email", "jan@example.com"]);
  git(root, ["config", "user.name", "January Author"]);

  return { root, docs };
}

test("a ~60%-similar replacement keeps February date and its own author", () => {
  const { root, docs } = initRepo();

  try {
    writeFileSync(join(docs, "001-old.md"), ORIGINAL);
    git(root, ["add", "docs/adr/001-old.md"]);
    commit(root, "add old", JANUARY, { name: "January Author", email: "jan@example.com" });

    rmSync(join(docs, "001-old.md"));
    writeFileSync(join(docs, "002-new.md"), TEMPLATE_COPY);
    git(root, ["add", "-A"]);
    commit(root, "replace with template copy", FEBRUARY, {
      name: "February Author",
      email: "feb@example.com",
    });

    assert.equal(createdAt(root, "docs/adr/002-new.md"), FEBRUARY_TS);
    assert.equal(addedBy(root, "docs/adr/002-new.md"), "February Author <feb@example.com>");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a ~90%-similar rename keeps January date and the first author", () => {
  const { root, docs } = initRepo();

  try {
    writeFileSync(join(docs, "010-before.md"), ORIGINAL);
    git(root, ["add", "docs/adr/010-before.md"]);
    commit(root, "add before", JANUARY, { name: "January Author", email: "jan@example.com" });

    rmSync(join(docs, "010-before.md"));
    writeFileSync(join(docs, "010-after.md"), RENAMED);
    git(root, ["add", "-A"]);
    commit(root, "rename document", FEBRUARY, {
      name: "February Author",
      email: "feb@example.com",
    });

    assert.equal(createdAt(root, "docs/adr/010-after.md"), JANUARY_TS);
    assert.equal(addedBy(root, "docs/adr/010-after.md"), "January Author <jan@example.com>");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
