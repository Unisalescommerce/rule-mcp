/**
 * @module scripts/bench/hook-lifecycle
 *
 * What the lifecycle hooks cost, and whether the three cache-touching ideas in
 * `docs/plans/_mcp-host-integration-depth.md` Phase 5 could pay for themselves.
 *
 * The plan asks for a measurement before any of them is implemented, and for an
 * item that does not move a number to be dropped rather than kept. This script is
 * that measurement, and it measures the three things the architecture decides:
 *
 * 1. **What a hook costs**: wall time and context size for each kind, because
 *    every character a hook injects is paid on every turn of every session.
 * 2. **Whether a warmed decision would be served**: the decision cache replay is
 *    behind `RULE_MCP_DECISION_CACHE_REPLAY=1` (ADR 157 keeps it off), so a
 *    prefetch written by `UserPromptSubmit` has no reader.
 * 3. **Whether an eager invalidation would save a stale read**: `cacheGet` checks
 *    the entry's dependencies and evicts on the read that found them stale, so an
 *    eager invalidation duplicates work that already happens.
 *
 * Run: node --import ./scripts/alias-hook.mjs scripts/bench/hook-lifecycle.mjs
 */

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { cacheEntries, cacheGet, cacheSet } from "../../packages/mcp/core/cache/tool-cache/index.js";
import { dependenciesHold, skillDigest } from "../../packages/mcp/core/cache/tool-cache/_digests.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ENTRY = fileURLToPath(new URL("../../bin/rule-mcp.js", import.meta.url));
const HOOK_KINDS = ["session-start", "prompt-submit", "structure", "write", "bash"];
const RUNS = 5;

/** A payload shaped like the one a host sends on the wire. */
const payloadFor = (kind) =>
  JSON.stringify(
    kind === "session-start"
      ? { source: "startup", cwd: ROOT }
      : kind === "prompt-submit"
        ? { prompt: "add pagination to the users endpoint", cwd: ROOT }
        : { tool_input: { file_path: `${ROOT}/README.md`, command: "git status" }, cwd: ROOT },
  );

/** Median of a list of numbers, in milliseconds. */
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** One hook invocation, timed, with the context it emitted. */
function runHook(kind) {
  const started = process.hrtime.bigint();

  const output = execFileSync(process.execPath, ["--import", `${ROOT}/scripts/alias-hook.mjs`, ENTRY, "guard", kind], {
    cwd: ROOT,
    input: payloadFor(kind),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  return { wall: Number(process.hrtime.bigint() - started) / 1e6, chars: output.length, output };
}

const rows = HOOK_KINDS.map((kind) => {
  const runs = Array.from({ length: RUNS }, () => runHook(kind));

  return { kind, wall: median(runs.map((run) => run.wall)), chars: runs.at(-1).chars };
});

// 2 - would a warmed decision be served?
const replayOn = process.env.RULE_MCP_DECISION_CACHE_REPLAY === "1";

// 3 - does an eager invalidation save anything the read does not?
// A real skill is the dependency a cached answer carries, so the bench stores one
// entry with its current digest and reads it back twice: once fresh, once after
// the digest the entry recorded no longer matches.
const skill = "rule-styleguide-json";
const fresh = { [skill]: skillDigest(skill) };
const recorded = { [skill]: "0000000000000000" };

cacheSet("bench:fresh", { ok: true }, fresh);
const freshRead = cacheGet("bench:fresh");
cacheSet("bench:stale", { ok: true }, recorded);
const staleRead = cacheGet("bench:stale");
const staleAfter = cacheEntries().length;

const report = {
  hooks: rows,
  decisionReplayEnabled: replayOn,
  cache: {
    freshReadServed: freshRead !== undefined,
    staleReadServed: staleRead !== undefined,
    entriesAfterStaleRead: staleAfter,
    dependencyCheckWorks: !dependenciesHold(recorded) && dependenciesHold(fresh),
  },
  totals: {
    injectedCharsPerSession: rows.find((row) => row.kind === "session-start").chars,
    injectedCharsPerPrompt: rows.find((row) => row.kind === "prompt-submit").chars,
    slowestHookMs: Math.max(...rows.map((row) => row.wall)),
  },
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const line = (cells) => cells.map((cell, index) => String(cell).padEnd(index === 0 ? 18 : 12)).join("");

  process.stdout.write(`${line(["hook", "median ms", "chars", "tokens ~"])}\n`);

  for (const row of rows) {
    process.stdout.write(`${line([row.kind, row.wall.toFixed(1), row.chars, Math.round(row.chars / 4)])}\n`);
  }

  process.stdout.write(`\nDecision-cache replay enabled: ${replayOn ? "yes - a prefetch would be served" : "no (ADR 157) - a prefetch would be written and never read"}\n`);
  process.stdout.write(`Fresh read served: ${report.cache.freshReadServed ? "yes" : "no"}\n`);
  process.stdout.write(`Stale read served without eager invalidation: ${report.cache.staleReadServed ? "yes" : "no - cacheGet evicts on the read"}\n`);
  process.stdout.write(`Dependency check works both ways: ${report.cache.dependencyCheckWorks ? "yes" : "no"}\n`);
}

export { report };
