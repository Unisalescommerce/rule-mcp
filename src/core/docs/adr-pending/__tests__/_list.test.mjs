/**
 * Pending ADRs are ordered by first-add commit, ties by slug.
 * A squash that stamps the same add commit falls back to slug order.
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { listPendingAdrs } from "../_list.js";

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

function initRepo() {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-pending-list-"));
  const pending = join(root, "docs", "adr", "_pending");

  mkdirSync(pending, { recursive: true });
  git(root, ["init"]);
  git(root, ["config", "user.email", "t@example.com"]);
  git(root, ["config", "user.name", "Tester"]);

  return { root, pending };
}

test("listPendingAdrs orders by first-add commit, then slug", () => {
  const { root, pending } = initRepo();

  try {
    writeFileSync(join(pending, "zebra-later.md"), "# Pending: Zebra\n");
    git(root, ["add", "docs/adr/_pending/zebra-later.md"]);
    commit(root, "add zebra", "2026-01-20T12:00:00 +0000");

    writeFileSync(join(pending, "alpha-earlier.md"), "# Pending: Alpha\n");
    git(root, ["add", "docs/adr/_pending/alpha-earlier.md"]);
    commit(root, "add alpha", "2026-01-10T12:00:00 +0000");

    // Same commit timestamp as alpha would be impossible after the fact; add a
    // third with a later stamp so the ordered pair is alpha then zebra.
    writeFileSync(join(pending, "middle.md"), "# Pending: Middle\n");
    git(root, ["add", "docs/adr/_pending/middle.md"]);
    commit(root, "add middle", "2026-01-15T12:00:00 +0000");

    const listed = listPendingAdrs(root).map((entry) => entry.slug);

    assert.deepEqual(listed, ["alpha-earlier", "middle", "zebra-later"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("listPendingAdrs ties on the same add commit break by slug", () => {
  const { root, pending } = initRepo();

  try {
    writeFileSync(join(pending, "z-slug.md"), "# Pending: Z\n");
    writeFileSync(join(pending, "a-slug.md"), "# Pending: A\n");
    git(root, ["add", "docs/adr/_pending"]);
    commit(root, "squash both", "2026-02-01T12:00:00 +0000");

    const listed = listPendingAdrs(root).map((entry) => entry.slug);

    assert.deepEqual(listed, ["a-slug", "z-slug"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
