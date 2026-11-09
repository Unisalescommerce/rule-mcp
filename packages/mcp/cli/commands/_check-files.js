/**
@module cli/commands/check-files

The files `rule-mcp check` reads, and how it reads each one: the named files
and the changed files from disk, the staged files from the index. A git that
fails throws, so the command can say the check did not run. The commit hook's
helpers are not used here: they swallow a git failure so the hook never
denies, and a gate must not read that as a clean index.

Git lists paths relative to the project root (`--relative`, `:./`), so a
project in a subdirectory of its repository sees its own files under the
names its `paths` globs use. A rename counts as a change of the new path.
*/

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

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
    return { files: listing(git(root, ["diff", "--cached", "--relative", "--name-only", "--diff-filter=ACMR", "-z", "--"])), read: (file) => git(root, ["show", `:./${file}`]) };
  }

  const since = git(root, ["merge-base", base, "HEAD"]).trim();
  const tracked = listing(git(root, ["diff", "--relative", "--name-only", "--diff-filter=ACMR", "-z", since, "--"]));
  const untracked = listing(git(root, ["ls-files", "--others", "--exclude-standard", "-z"]));

  return { files: [...new Set([...tracked, ...untracked])], read: fromDisk };
}
