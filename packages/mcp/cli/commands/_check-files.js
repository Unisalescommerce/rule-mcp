/**
@module cli/commands/check-files

The files `rule-mcp check` reads, and how it reads each one: the named files
and the changed files from disk, the staged files from the index. A git that
fails throws, so the command can say the check did not run.
*/

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

import { stagedBlob, stagedFiles } from "../guard/_staged.js";

/** Run git in the project root; throws when git does. */
const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024 });

/** A NUL-separated git listing as paths. */
const listing = (text) => text.split("\0").filter(Boolean);

/**
The files to check and how to read each one.

@param {string} root
@param {{ staged?: boolean, files?: string, base?: string }} options - neither staged nor files means --changed
@returns {{ files: string[], read: (file: string) => string|null }}
*/
export function collectFiles(root, { staged, files, base = "HEAD" }) {
  const fromDisk = (file) => readFileSync(join(root, file), "utf8");

  if (files !== undefined) {
    const named = files
      .split(",")
      .map((file) => file.trim())
      .filter(Boolean)
      .map((file) => relative(root, isAbsolute(file) ? file : resolve(root, file)).replaceAll("\\", "/"));

    return { files: named, read: fromDisk };
  }

  git(root, ["rev-parse", "--show-toplevel"]);

  if (staged) {
    return { files: stagedFiles({ cwd: root }), read: (file) => stagedBlob(file, { cwd: root }) };
  }

  const since = git(root, ["merge-base", base, "HEAD"]).trim();
  const tracked = listing(git(root, ["diff", "--name-only", "--diff-filter=ACMR", "-z", since, "--"]));
  const untracked = listing(git(root, ["ls-files", "--others", "--exclude-standard", "-z"]));

  return { files: [...new Set([...tracked, ...untracked])], read: fromDisk };
}
