/** A project on a trunk, for the ADR tests that assert a number. */

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const git = (root, ...arguments_) => execFileSync("git", arguments_, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

/**
 * A project on a trunk, because numbering happens on trunk and a bare directory
 * is off one: ADR 196 keeps ADRs pending until they land, so a temp directory
 * that is not a repository tested the pending path while asserting a number.
 */
export const trunkProject = (prefix) => {
  const root = mkdtempSync(join(tmpdir(), prefix));

  git(root, "init", "--initial-branch=main", "-q");
  git(root, "config", "user.email", "fixture@example.com");
  git(root, "config", "user.name", "Fixture");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", "-A");
  git(root, "commit", "-qm", "chore(fixture): initial");

  return root;
};

