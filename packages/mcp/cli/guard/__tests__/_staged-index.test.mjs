/** The agent commit gate must inspect Git's index, not the working tree. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { stagedFiles, stagedFailures } from "../_staged.js";

function repo() {
  const cwd = mkdtempSync(join(tmpdir(), "rule-staged-"));
  const git = (...args) => execFileSync("git", ["-c", "core.hooksPath=/dev/null", ...args], { cwd, stdio: "pipe" });

  git("init", "-q");

  return { cwd, git };
}

test("checks staged bytes even when the working tree differs", () => {
  const { cwd, git } = repo();
  const seen = [];

  try {
    writeFileSync(join(cwd, "file.js"), "staged content\n");
    git("add", "file.js");
    writeFileSync(join(cwd, "file.js"), "unstaged content\n");
    const failures = stagedFailures({
      cwd,
      check: (skill, code) => {
        seen.push(code);
        return { allPass: false, failed: [{ id: "sample" }] };
      },
    });

    assert.deepEqual(seen, ["staged content\n"]);
    assert.deepEqual(failures, [{ file: "file.js", failures: ["sample"] }]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("preserves special characters in staged filenames", () => {
  const { cwd, git } = repo();
  const file = 'quote" and\nline.js';

  try {
    writeFileSync(join(cwd, file), "code\n");
    git("add", "--", file);
    assert.deepEqual(stagedFiles({ cwd }), [file]);
    const seen = [];

    stagedFailures({
      cwd,
      check: (skill, code) => {
        seen.push(code);
        return { allPass: true, failed: [] };
      },
    });
    assert.deepEqual(seen, ["code\n"]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
