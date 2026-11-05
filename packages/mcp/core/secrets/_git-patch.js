/**
@module core/secrets/git-patch

The patch a commit would add, produced by git and by nothing else.

Every flag on the diff is there to keep a repository's own configuration out
of the patch: `--no-ext-diff` and `--no-textconv` stop git from running a
helper the repository selects, `--no-color` is needed even when piping
because configuration can force color, and the fixed prefixes keep paths
intact under `diff.noprefix`. A patch assembled with a helper's output is a
patch that can execute code from the repository it is scanning.

A git that fails returns a reason, never an empty patch: the caller has to be
able to tell "nothing is staged" from "this is not a repository".
*/

import { execFileSync } from "node:child_process";
import { firstLine } from "./_util.js";

/** How long the diff may take before it is killed. */
export const GIT_TIMEOUT_MS = 5_000;

/** The largest patch worth scanning. */
export const MAX_PATCH_BYTES = 4 * 1024 * 1024;

/** The flags that keep a repository's own configuration out of the patch. */
const PATCH_FLAGS = ["--no-ext-diff", "--no-textconv", "--no-color", "--src-prefix=a/", "--dst-prefix=b/"];

/** The diff arguments for the patch a commit would add. */
export const STAGED_DIFF_ARGS = ["diff", "--cached", ...PATCH_FLAGS];

/**
The diff arguments for a revision range, `A..B` or `A...B`.

@param {string} range
@returns {string[]}
*/
export function rangeDiffArgs(range) {
  if (typeof range !== "string" || !range || range.startsWith("-") || /[\s\0]/u.test(range)) {
    throw new TypeError("Invalid revision selection");
  }

  return ["log", "-p", "--root", "--format=medium", "--no-abbrev-commit", "--diff-merges=first-parent", ...PATCH_FLAGS, range, "--"];
}

/**
Why git could not produce a patch, in one line.

@param {unknown} error
@returns {string}
*/
function gitFailureReason(error) {
  if (error?.code === "ENOBUFS") {
    return "the staged patch is larger than 4 MiB";
  }

  return firstLine(error?.stderr) || firstLine(error?.message) || "git could not produce a patch";
}

/**
A patch, as git writes it.

@param {string[]} args - The diff arguments
@param {{ exec?: Function, cwd?: string }} [options] - Injected exec and working directory
@returns {{ patch: string, reason: string }}
*/
export function diffPatch(args, { exec = execFileSync, cwd } = {}) {
  try {
    const patch = exec("git", args, {
      encoding: "utf8",
      timeout: GIT_TIMEOUT_MS,
      killSignal: "SIGKILL",
      maxBuffer: MAX_PATCH_BYTES,
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    return { patch: String(patch ?? ""), reason: "" };
  } catch (error) {
    return { patch: "", reason: gitFailureReason(error) };
  }
}

/**
The patch a commit would add.

@param {{ exec?: Function, cwd?: string }} [options] - Injected exec and working directory
@returns {{ patch: string, reason: string }}
*/
export function stagedPatch({ exec = execFileSync, cwd } = {}) {
  return diffPatch(STAGED_DIFF_ARGS, { exec, cwd });
}
