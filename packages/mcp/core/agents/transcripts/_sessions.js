/**
@module core/agents/transcripts/sessions

Session map for export: list, sort oldest→newest, mark current. No deletes.

@see docs/plans/_export.md Step 0 (EX-02)
*/

import { basename, dirname, join } from "node:path";
import { homedir } from "node:os";

import { filesUnder, mtime, readJson, readJsonl, slugsFor } from "./_fs.js";
import { AGENT_TRANSCRIPTS } from "./_registry.js";

/**
 * @typedef {{ id: string, path: string, mtime: number, current?: boolean }} SessionRow
 * @typedef {{ sessions: SessionRow[], currentUnknown: boolean, skipped?: boolean, reason?: string }} SessionMap
 */

/**
 * List one agent's sessions for one project, oldest first.
 *
 * @param {{ agent: string, projectDir: string, home?: string }} options
 * @returns {SessionMap}
 */
export function listSessions({ agent, projectDir, home = homedir() }) {
  const entry = AGENT_TRANSCRIPTS.find((item) => item.agent === agent);

  if (!entry) {
    return { sessions: [], currentUnknown: false, skipped: true, reason: `unknown agent: ${agent}` };
  }

  if (!entry.read) {
    return { sessions: [], currentUnknown: false, skipped: true, reason: entry.reason };
  }

  const rows = listForAgent({ agent, projectDir, home });

  return markCurrent(rows);
}

/** @param {{ agent: string, projectDir: string, home: string }} options @returns {SessionRow[]} */
function listForAgent({ agent, projectDir, home }) {
  if (agent === "pi") {
    return jsonlSessions(join(home, ".pi", "agent", "sessions", slugsFor(projectDir).pi));
  }

  if (agent === "claude") {
    return jsonlSessions(join(home, ".claude", "projects", slugsFor(projectDir).claude));
  }

  if (agent === "codex") {
    return codexSessions({ projectDir, home });
  }

  if (agent === "opencode") {
    return opencodeSessions({ projectDir, home });
  }

  return [];
}

/** One JSONL file = one session. */
function jsonlSessions(dir) {
  return filesUnder(dir, 0)
    .filter((file) => file.endsWith(".jsonl"))
    .map((file) => ({ id: basename(file, ".jsonl"), path: file, mtime: mtime(file) }))
    .sort((a, b) => a.mtime - b.mtime);
}

/** Codex rollouts under dated dirs, filtered by session_meta.cwd. */
function codexSessions({ projectDir, home }) {
  return filesUnder(join(home, ".codex", "sessions"), 3)
    .filter((file) => file.endsWith(".jsonl"))
    .filter((file) => readJsonl(file).find((row) => row.type === "session_meta")?.payload?.cwd === projectDir)
    .map((file) => ({ id: basename(file, ".jsonl"), path: file, mtime: mtime(file) }))
    .sort((a, b) => a.mtime - b.mtime);
}

/** opencode: one session directory (or sessionID) per project. */
function opencodeSessions({ projectDir, home }) {
  const base = join(home, ".local", "share", "opencode", "storage", "message");
  const files = filesUnder(base, 1);
  const bySession = new Map();

  for (const file of files) {
    const row = readJson(file);

    if (!row || ((row.path?.root ?? row.path?.cwd) !== projectDir)) {
      continue;
    }

    const id = row.sessionID ?? basename(dirname(file));
    const path = row.sessionID ? join(base, row.sessionID) : dirname(file);
    const at = mtime(file);
    const prior = bySession.get(id);

    if (!prior || at > prior.mtime) {
      bySession.set(id, { id, path, mtime: at });
    }
  }

  return [...bySession.values()].sort((a, b) => a.mtime - b.mtime);
}

/** Newest unique mtime is current; a tie refuses to pick. */
function markCurrent(rows) {
  if (rows.length === 0) {
    return { sessions: [], currentUnknown: false };
  }

  const newest = Math.max(...rows.map((row) => row.mtime));
  const tied = rows.filter((row) => row.mtime === newest);

  if (tied.length > 1) {
    return { sessions: rows.map((row) => ({ ...row, current: false })), currentUnknown: true };
  }

  return {
    sessions: rows.map((row) => ({ ...row, current: row.mtime === newest })),
    currentUnknown: false,
  };
}
