/**
@module core/secrets/probe

The cheap, deterministic probe the betterleaks gate branches on.

The gate runs inside a PreToolUse hook, so this module answers with data and
never throws: an absent binary, a launcher whose target moved and a v1
install that speaks a different command set are three different "cannot
scan" answers, and each one has to reach the caller as a reason it can print.
A throw here would surface as a broken hook, which the host reads as "allow".

The probe is memoized because the hook process asks once per tool call and a
`betterleaks --version` spawn per call is a cost with no new information.

@see module:core/guardrails/project/run - the fail-soft precedent this copies
*/

import { execFileSync } from "node:child_process";
import { firstLine } from "./_util.js";

/** How long the version probe may take before it is killed. */
export const PROBE_TIMEOUT_MS = 1000;

/** The betterleaks major whose command set this gate speaks. */
export const SUPPORTED_MAJOR = 2;

/** The version a release prints, pre-release suffix and all. */
const VERSION_RE = /(\d+)\.(\d+)\.(\d+)(?:[-+][0-9A-Za-z.-]+)?/;

/** The last answer, or `null` before the first probe. */
let cached = null;

/**
Why the binary could not answer, in one line a hook message can carry.

@param {unknown} error
@returns {string}
*/
function unavailableReason(error) {
  if (error?.code === "ENOENT") {
    return "betterleaks is not on PATH";
  }

  const stderr = firstLine(error?.stderr);

  if (stderr) {
    return stderr;
  }

  if (error?.signal === "SIGKILL" || error?.code === "ETIMEDOUT") {
    return `betterleaks --version did not answer within ${PROBE_TIMEOUT_MS}ms`;
  }

  return firstLine(error?.message) || "betterleaks could not be run";
}

/**
Read what the installed binary says about itself.

An unparseable version is trusted rather than refused: a source build prints
`dev` and answers the same commands, so refusing it would refuse a
contributor's own build. A known v1 is refused, because `--git-diff` does not
exist there and a scan that silently looks clean is worse than no scan.

@param {{ exec?: Function }} [options] - Injected exec, so a test never spawns
@returns {{ available: boolean, version: string|null, major: number|null, supported: boolean, reason: string }}
*/
export function readVersion({ exec = execFileSync } = {}) {
  let output;

  try {
    output = exec("betterleaks", ["--version"], {
      encoding: "utf8",
      timeout: PROBE_TIMEOUT_MS,
      killSignal: "SIGKILL",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    return { available: false, version: null, major: null, supported: false, reason: unavailableReason(error) };
  }

  const match = VERSION_RE.exec(String(output ?? ""));
  const version = match ? match[0] : null;
  const major = match ? Number(match[1]) : null;
  const supported = major === null || major >= SUPPORTED_MAJOR;

  return {
    available: true,
    version,
    major,
    supported,
    reason: supported ? "" : `betterleaks v${major} answers a different command set; the gate speaks v${SUPPORTED_MAJOR} (stdin --git-diff)`,
  };
}

/**
The probe answer for this process.

An injected exec bypasses the cache: a test that shares a cached answer with
the next test measures the cache, not the probe.

@param {{ exec?: Function, refresh?: boolean }} [options]
@returns {{ available: boolean, version: string|null, major: number|null, supported: boolean, reason: string }}
*/
export function probeBetterleaks({ exec, refresh = false } = {}) {
  if (typeof exec === "function") {
    return readVersion({ exec });
  }

  if (cached && !refresh) {
    return cached;
  }

  cached = readVersion();

  return cached;
}
