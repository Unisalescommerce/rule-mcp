/**
@module core/export/cleanup

Hard-delete sessions outside keep-set = newest N ∪ {current}.
Confirm-gated; refuses when currentUnknown; unsupported agents untouched.

@see docs/plans/_export.md Step 6 (EX-01, EX-06)
*/

import { rmSync } from "node:fs";
import { homedir } from "node:os";

import { listSessions } from "../../agents/transcripts/index.js";

/** Default newest-N retained when env is unset or unparsable. */
const DEFAULT_KEEP = 5;

/**
 * Keep-set ids: newest `keep` by mtime, plus every session marked current.
 *
 * @param {{ id: string, mtime: number, current?: boolean }[]} sessions
 * @param {{ keep?: number }} [options]
 * @returns {Set<string>}
 */
export function keepSet(sessions, { keep = DEFAULT_KEEP } = {}) {
  const limit = Math.max(0, Number(keep) || 0);
  const newest = [...sessions].sort((a, b) => b.mtime - a.mtime).slice(0, limit);
  const ids = new Set(newest.map((row) => row.id));

  for (const row of sessions) {
    if (row.current) {
      ids.add(row.id);
    }
  }

  return ids;
}

/**
 * Plan which session paths would be deleted. Never deletes.
 *
 * @param {{
 *   agent: string,
 *   sessions: { id: string, path?: string, mtime: number, current?: boolean }[],
 *   currentUnknown: boolean,
 *   keep?: number,
 *   skippedReason?: string,
 * }} options
 * @returns {{
 *   ok: boolean,
 *   reason?: string,
 *   skipped?: boolean,
 *   delete: { id: string, path: string }[],
 *   keep?: string[],
 * }}
 */
export function planCleanup({ agent, sessions, currentUnknown, keep = DEFAULT_KEEP, skippedReason }) {
  if (skippedReason) {
    return { ok: false, skipped: true, reason: skippedReason, delete: [] };
  }

  if (currentUnknown) {
    return { ok: false, reason: "currentUnknown", delete: [] };
  }

  const kept = keepSet(sessions, { keep });
  const doomed = sessions.filter((row) => !kept.has(row.id) && typeof row.path === "string" && row.path.length > 0).map((row) => ({ id: row.id, path: row.path }));

  return { ok: true, delete: doomed, keep: [...kept], agent };
}

/**
 * Resolve keep-N from an explicit option or RULE_MCP_EXPORT_KEEP_SESSIONS.
 *
 * @param {number|undefined} keep
 * @returns {number}
 */
export function resolveKeep(keep) {
  if (typeof keep === "number" && Number.isFinite(keep)) {
    return Math.max(0, keep);
  }

  const raw = process.env.RULE_MCP_EXPORT_KEEP_SESSIONS;
  const parsed = raw === undefined || raw === "" ? DEFAULT_KEEP : Number.parseInt(raw, 10);

  return Number.isFinite(parsed) ? Math.max(0, parsed) : DEFAULT_KEEP;
}

/**
 * Confirm-gated hard delete outside the keep-set for one agent/project.
 *
 * @param {{
 *   agent: string,
 *   projectDir: string,
 *   home?: string,
 *   confirmed?: boolean,
 *   keep?: number,
 * }} options
 * @returns {{
 *   ok: boolean,
 *   reason?: string,
 *   skipped?: boolean,
 *   delete?: { id: string, path: string }[],
 *   deleted?: { id: string, path: string }[],
 *   keep?: string[],
 * }}
 */
export function runCleanup({ agent, projectDir, home = homedir(), confirmed = false, keep }) {
  if (!confirmed) {
    return { ok: false, reason: "unconfirmed", delete: [] };
  }

  const keepN = resolveKeep(keep);
  const map = listSessions({ agent, projectDir, home });

  if (map.skipped) {
    return planCleanup({
      agent,
      sessions: map.sessions,
      currentUnknown: map.currentUnknown,
      keep: keepN,
      skippedReason: map.reason,
    });
  }

  const plan = planCleanup({
    agent,
    sessions: map.sessions,
    currentUnknown: map.currentUnknown,
    keep: keepN,
  });

  if (!plan.ok) {
    return plan;
  }

  for (const item of plan.delete) {
    rmSync(item.path, { recursive: true, force: true });
  }

  return { ok: true, deleted: plan.delete, keep: plan.keep, delete: plan.delete };
}
