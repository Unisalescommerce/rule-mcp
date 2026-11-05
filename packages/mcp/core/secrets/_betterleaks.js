/**
@module core/secrets/betterleaks

The scan the git gate runs: the staged patch, through betterleaks, offline.

Three decisions are baked in here and each one is a policy, not a default.

- The patch arrives on stdin (`stdin --git-diff`) instead of a repository
  path, so the scan sees exactly what the commit would add and never walks a
  history the caller did not ask about.
- `--exit-code=0` turns "leaks found" into a success exit. With the default
  of 1, a finding and a broken binary are the same number, and the gate could
  not tell "stop, there is a credential" from "I could not scan".
- Explicitly disable validation and analysis, including environment overrides. A guardrail
  whose answer depends on a network is not a guardrail.

`--redact` stays on even though the finding drops its match value, because
the report document can carry a context window.

@see module:core/secrets/probe - whether the binary is there to run
@see module:core/secrets/report - how the document is read
*/

import { execFileSync } from "node:child_process";
import { MAX_PATCH_BYTES, diffPatch, rangeDiffArgs, stagedPatch } from "./_git-patch.js";
import { parseReport } from "./_report.js";
import { firstLine } from "./_util.js";

/** How long the scan may take before it is killed. */
export const SCAN_TIMEOUT_MS = 10_000;

/** The scan arguments: stdin, patch mode, redacted, findings are not an error. */
export const SCAN_ARGS = ["stdin", "--git-diff", "--redact", "--no-banner", "--output=-", "--exit-code=0", "--validate=false", "--analyze=false"];

/**
Why the scan could not answer, in one line.

@param {unknown} error
@returns {string}
*/
function scanFailureReason(error) {
  if (error?.signal === "SIGKILL" || error?.code === "ETIMEDOUT") {
    return `betterleaks did not answer within ${SCAN_TIMEOUT_MS}ms`;
  }

  const stderr = firstLine(error?.stderr);

  if (stderr) {
    return stderr;
  }

  const status = error?.status;

  return status === undefined || status === null ? firstLine(error?.message) || "betterleaks could not run" : `betterleaks exited ${status}`;
}

/**
Scan a patch.

@param {string} patch - A `git diff` stream
@param {{ exec?: Function }} [options] - Injected exec, so a test never spawns
@returns {{ scanned: boolean, findings: Array<object>, reason: string }}
*/
export function scanPatch(patch, { exec = execFileSync } = {}) {
  const text = patch ?? "";

  if (text.trim() === "") {
    return { scanned: true, findings: [], reason: "" };
  }

  const bytes = Buffer.byteLength(text, "utf8");

  if (bytes > MAX_PATCH_BYTES) {
    return { scanned: false, findings: [], reason: `the patch is ${bytes} bytes; the cap is 4 MiB, so commit it in smaller units` };
  }

  let stdout;

  try {
    stdout = exec("betterleaks", SCAN_ARGS, {
      input: text,
      encoding: "utf8",
      timeout: SCAN_TIMEOUT_MS,
      killSignal: "SIGKILL",
      maxBuffer: MAX_PATCH_BYTES,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    return { scanned: false, findings: [], reason: scanFailureReason(error) };
  }

  try {
    return { scanned: true, findings: parseReport(stdout), reason: "" };
  } catch (error) {
    return { scanned: false, findings: [], reason: error.message };
  }
}

/**
One patch from git, scanned.

@param {{ patch: string, reason: string }} produced - What git wrote
@param {{ exec?: Function }} options
@returns {{ scanned: boolean, findings: Array<object>, reason: string }}
*/
function scanProduced(produced, { exec }) {
  if (produced.reason) {
    return { scanned: false, findings: [], reason: produced.reason };
  }

  return scanPatch(produced.patch, { exec });
}

/**
The staged patch, scanned.

@param {{ exec?: Function, cwd?: string }} [options] - Injected exec and working directory
@returns {{ scanned: boolean, findings: Array<object>, reason: string }}
*/
export function scanStaged({ exec = execFileSync, cwd } = {}) {
  return scanProduced(stagedPatch({ exec, cwd }), { exec });
}

/**
The patch a revision range adds, scanned.

@param {string} range - `A..B` or `A...B`
@param {{ exec?: Function, cwd?: string }} [options] - Injected exec and working directory
@returns {{ scanned: boolean, findings: Array<object>, reason: string }}
*/
export function scanRange(range, { exec = execFileSync, cwd } = {}) {
  return scanProduced(diffPatch(rangeDiffArgs(range), { exec, cwd }), { exec });
}
