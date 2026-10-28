/** Off-trunk settle moves the newer duplicate number back into _pending. */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { settleDuplicateAdrs } from "../_settle.js";

function git(cwd, args, env = {}) {
  execFileSync("git", args, {
    cwd,
    env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function commit(cwd, message, when) {
  git(cwd, ["-c", "core.hooksPath=/dev/null", "commit", "--no-verify", "-m", message], {
    GIT_AUTHOR_DATE: when,
    GIT_COMMITTER_DATE: when,
    GIT_AUTHOR_NAME: "Tester",
    GIT_AUTHOR_EMAIL: "t@example.com",
    GIT_COMMITTER_NAME: "Tester",
    GIT_COMMITTER_EMAIL: "t@example.com",
  });
}

test("settleDuplicateAdrs keeps the older file and pending the newer", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-settle-"));
  const adr = join(root, "docs", "adr");

  try {
    mkdirSync(adr, { recursive: true });
    git(root, ["init", "-b", "feat/work"]);
    git(root, ["config", "user.email", "t@example.com"]);
    git(root, ["config", "user.name", "Tester"]);

    writeFileSync(join(adr, "010-first.md"), "# 010: First\n\n- **Date**: 2026-01-01\n- **Status**: accepted\n");
    git(root, ["add", "docs/adr/010-first.md"]);
    commit(root, "first", "2026-01-01T12:00:00 +0000");

    writeFileSync(join(adr, "010-second.md"), "# 010: Second\n\n- **Date**: 2026-02-01\n- **Status**: accepted\n");
    git(root, ["add", "docs/adr/010-second.md"]);
    commit(root, "second", "2026-02-01T12:00:00 +0000");

    const result = settleDuplicateAdrs(root);

    assert.equal(result.settled.length, 1);
    assert.ok(readdirSync(adr).includes("010-first.md"));
    assert.ok(!readdirSync(adr).includes("010-second.md"));
    assert.ok(readdirSync(join(adr, "_pending")).includes("second.md"));
    assert.match(readFileSync(join(adr, "_pending", "second.md"), "utf8"), /^# Pending: Second/m);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
