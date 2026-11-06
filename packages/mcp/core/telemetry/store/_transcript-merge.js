/**
@module core/telemetry/store/transcript-merge

Fold transcript-derived usage into the project telemetry store, keyed by a
content/window digest so a second `/rule-export` cannot inflate stats (EX-03).

@see docs/plans/_export.md Step 1
*/

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

import { getProjectPaths } from "@mcp/cli/paths/index.js";
import { detectAgentUsage } from "../../agents/transcripts/index.js";

/**
 * Stable digest of one window's measured usage.
 *
 * @param {{ projectDir: string, since?: number, until?: number, usage: object }} options
 * @returns {string}
 */
export function usageDigest({ projectDir, since, until, usage }) {
  const payload = JSON.stringify({
    agent: usage.agent ?? null,
    projectDir,
    since: since ?? null,
    until: until ?? null,
    input: usage.input ?? 0,
    output: usage.output ?? 0,
    apiCalls: usage.apiCalls ?? 0,
    userTurns: usage.userTurns ?? 0,
    cacheRead: usage.cacheRead ?? 0,
    cacheWrite: usage.cacheWrite ?? 0,
  });

  return createHash("sha256").update(payload).digest("hex");
}

/** @param {string} [projectDir] @returns {string} */
function mergeFile(projectDir = process.cwd()) {
  return join(getProjectPaths(projectDir).dir, "transcript-merge.json");
}

/** @param {string} [projectDir] @returns {{ digests: string[], usage?: object }} */
function readLedger(projectDir) {
  try {
    const file = mergeFile(projectDir);

    if (!existsSync(file)) {
      return { digests: [] };
    }

    const parsed = JSON.parse(readFileSync(file, "utf8"));

    return parsed && Array.isArray(parsed.digests) ? parsed : { digests: [] };
  } catch {
    return { digests: [] };
  }
}

/** @param {string} projectDir @param {{ digests: string[], usage: object }} ledger */
function writeLedger(projectDir, ledger) {
  const { dir } = getProjectPaths(projectDir);

  mkdirSync(dir, { recursive: true });
  writeFileSync(mergeFile(projectDir), JSON.stringify(ledger, undefined, 2));
}

/**
 * Merge measured transcript usage for one project window into the store.
 *
 * @param {{
 *   projectDir: string,
 *   home?: string,
 *   client?: string,
 *   since?: number,
 *   until?: number,
 * }} options
 * @returns {{ status: "merged"|"unchanged"|"empty", digest?: string, usage?: object }}
 */
export function mergeTranscriptTelemetry({ projectDir, home = homedir(), client, since, until } = {}) {
  if (!projectDir) {
    return { status: "empty" };
  }

  const measured = detectAgentUsage({ projectDir, home, client, since, until });

  if (!measured) {
    return { status: "empty" };
  }

  const digest = usageDigest({ projectDir, since, until, usage: measured });
  const ledger = readLedger(projectDir);

  if (ledger.digests.includes(digest)) {
    return { status: "unchanged", digest, usage: ledger.usage };
  }

  const usage = { ...measured, source: "transcript", digest };

  writeLedger(projectDir, {
    digests: [...ledger.digests, digest],
    usage,
  });

  return { status: "merged", digest, usage };
}

/**
 * The last merged usage for this project, if any.
 *
 * @param {string} [projectDir]
 * @returns {object|undefined}
 */
export function readMergedUsage(projectDir = process.cwd()) {
  return readLedger(projectDir).usage;
}
