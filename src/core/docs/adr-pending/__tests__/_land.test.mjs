/** Landing numbers pending ADRs on trunk and rewrites ADR <slug> references. */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { landPendingAdrs } from "../_land.js";

function git(cwd, args, env = {}) {
  execFileSync("git", args, {
    cwd,
    env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function commit(cwd, message, when = "2026-03-01T12:00:00 +0000") {
  git(cwd, ["-c", "core.hooksPath=/dev/null", "commit", "--no-verify", "-m", message], {
    GIT_AUTHOR_DATE: when,
    GIT_COMMITTER_DATE: when,
    GIT_AUTHOR_NAME: "Tester",
    GIT_AUTHOR_EMAIL: "t@example.com",
    GIT_COMMITTER_NAME: "Tester",
    GIT_COMMITTER_EMAIL: "t@example.com",
  });
}

function initOn(branch) {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-land-"));
  const pending = join(root, "docs", "adr", "_pending");
  const adr = join(root, "docs", "adr");

  mkdirSync(pending, { recursive: true });
  git(root, ["init", "-b", branch]);
  git(root, ["config", "user.email", "t@example.com"]);
  git(root, ["config", "user.name", "Tester"]);
  writeFileSync(join(adr, "001-existing.md"), "# 001: Existing\n\n- **Date**: 2026-01-01\n- **Status**: accepted\n");
  writeFileSync(join(adr, "ADR.md"), "# Index\n");
  git(root, ["add", "docs/adr"]);
  commit(root, "seed");

  return { root, pending, adr };
}

test("landPendingAdrs is a no-op off trunk", () => {
  const { root, pending } = initOn("feat/work");

  try {
    writeFileSync(join(pending, "new-decision.md"), "# Pending: New decision\n");
    git(root, ["add", "docs/adr/_pending"]);
    commit(root, "pending");

    const result = landPendingAdrs(root);

    assert.equal(result.skipped, "not on a trunk branch");
    assert.equal(result.landed.length, 0);
    assert.ok(readdirSync(pending).includes("new-decision.md"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("landPendingAdrs numbers in list order and rewrites ADR <slug>", () => {
  const { root, pending, adr } = initOn("main");

  try {
    writeFileSync(join(pending, "zeta.md"), "# Pending: Zeta\n");
    git(root, ["add", "docs/adr/_pending/zeta.md"]);
    commit(root, "zeta", "2026-03-10T12:00:00 +0000");
    writeFileSync(join(pending, "alpha.md"), "# Pending: Alpha\n");
    git(root, ["add", "docs/adr/_pending/alpha.md"]);
    commit(root, "alpha", "2026-03-20T12:00:00 +0000");

    writeFileSync(
      join(root, "docs", "notes.md"),
      "See ADR alpha and docs/adr/_pending/zeta.md before merge.\n",
    );
    git(root, ["add", "docs/notes.md"]);
    commit(root, "notes");

    const result = landPendingAdrs(root);

    assert.equal(result.skipped, null);
    assert.deepEqual(
      result.landed.map((entry) => `${entry.number}:${entry.slug}`),
      ["2:zeta", "3:alpha"],
    );
    assert.ok(readdirSync(adr).includes("002-zeta.md"));
    assert.ok(readdirSync(adr).includes("003-alpha.md"));
    assert.match(readFileSync(join(adr, "002-zeta.md"), "utf8"), /^# 002: Zeta/m);
    assert.match(readFileSync(join(root, "docs", "notes.md"), "utf8"), /ADR 003/);
    assert.match(readFileSync(join(root, "docs", "notes.md"), "utf8"), /docs\/adr\/002-zeta\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
