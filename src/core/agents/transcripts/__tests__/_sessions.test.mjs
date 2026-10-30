/**
@module test/agents/transcripts/sessions

EX-02: session map API — list/sort/identify current per supported agent.
No deletes in this suite.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { listSessions } = await import("../index.js");

const home = mkdtempSync(join(tmpdir(), "rule-mcp-sessions-home-"));

test.after(() => rmSync(home, { recursive: true, force: true }));

/** Stamp a file's mtime so ordering is deterministic. */
function stamp(file, ms) {
  const at = new Date(ms);

  utimesSync(file, at, at);
}

test("claude sessions list oldest to newest and mark the newest current", () => {
  const projectDir = mkdtempSync(join(tmpdir(), "rule-mcp-sessions-claude-"));
  const dir = join(home, ".claude", "projects", projectDir.replaceAll("/", "-"));
  mkdirSync(dir, { recursive: true });

  const older = join(dir, "old.jsonl");
  const newer = join(dir, "new.jsonl");

  writeFileSync(older, `${JSON.stringify({ type: "user", message: { content: "a" } })}\n`);
  writeFileSync(newer, `${JSON.stringify({ type: "user", message: { content: "b" } })}\n`);
  stamp(older, Date.parse("2026-01-01T00:00:00Z"));
  stamp(newer, Date.parse("2026-01-02T00:00:00Z"));

  const map = listSessions({ agent: "claude", projectDir, home });

  assert.equal(map.currentUnknown, false);
  assert.deepEqual(
    map.sessions.map((session) => session.id),
    ["old", "new"],
    "oldest first",
  );
  assert.equal(map.sessions[0].current, false);
  assert.equal(map.sessions[1].current, true);
  assert.equal(map.sessions[1].path, newer);

  rmSync(projectDir, { recursive: true, force: true });
});

test("a tied newest mtime flags currentUnknown and marks no current", () => {
  const projectDir = mkdtempSync(join(tmpdir(), "rule-mcp-sessions-tie-"));
  const dir = join(home, ".claude", "projects", projectDir.replaceAll("/", "-"));
  mkdirSync(dir, { recursive: true });

  const a = join(dir, "a.jsonl");
  const b = join(dir, "b.jsonl");
  const when = Date.parse("2026-01-03T00:00:00Z");

  writeFileSync(a, "{}\n");
  writeFileSync(b, "{}\n");
  stamp(a, when);
  stamp(b, when);

  const map = listSessions({ agent: "claude", projectDir, home });

  assert.equal(map.currentUnknown, true);
  assert.ok(map.sessions.every((session) => session.current !== true));

  rmSync(projectDir, { recursive: true, force: true });
});

test("pi sessions use the pi slug directory", () => {
  const projectDir = "/Users/me/Projects/app";
  const slug = `--Users-me-Projects-app--`;
  const dir = join(home, ".pi", "agent", "sessions", slug);
  mkdirSync(dir, { recursive: true });

  const file = join(dir, "s1.jsonl");
  writeFileSync(file, "{}\n");
  stamp(file, Date.parse("2026-01-04T00:00:00Z"));

  const map = listSessions({ agent: "pi", projectDir, home });

  assert.equal(map.sessions.length, 1);
  assert.equal(map.sessions[0].id, "s1");
  assert.equal(map.sessions[0].current, true);
});

test("codex sessions filter by session_meta.cwd", () => {
  const projectDir = "/tmp/export-codex-project";
  const other = "/tmp/other";
  const day = join(home, ".codex", "sessions", "2026", "01", "05");
  mkdirSync(day, { recursive: true });

  const match = join(day, "rollout-match.jsonl");
  const miss = join(day, "rollout-miss.jsonl");

  writeFileSync(
    match,
    `${JSON.stringify({ type: "session_meta", payload: { cwd: projectDir } })}\n`,
  );
  writeFileSync(miss, `${JSON.stringify({ type: "session_meta", payload: { cwd: other } })}\n`);
  stamp(match, Date.parse("2026-01-05T00:00:00Z"));
  stamp(miss, Date.parse("2026-01-05T01:00:00Z"));

  const map = listSessions({ agent: "codex", projectDir, home });

  assert.equal(map.sessions.length, 1);
  assert.equal(map.sessions[0].id, "rollout-match");
  assert.equal(map.sessions[0].current, true);
});

test("opencode sessions group by sessionID for the project", () => {
  const projectDir = "/tmp/export-opencode-project";
  const base = join(home, ".local", "share", "opencode", "storage", "message");
  const s1 = join(base, "sess-1");
  const s2 = join(base, "sess-2");
  mkdirSync(s1, { recursive: true });
  mkdirSync(s2, { recursive: true });

  const keep = join(s1, "msg.json");
  const drop = join(s2, "msg.json");

  writeFileSync(keep, JSON.stringify({ sessionID: "sess-1", path: { root: projectDir }, time: { created: Date.parse("2026-01-06T00:00:00Z") } }));
  writeFileSync(drop, JSON.stringify({ sessionID: "sess-2", path: { root: "/tmp/elsewhere" }, time: { created: Date.parse("2026-01-06T01:00:00Z") } }));
  stamp(keep, Date.parse("2026-01-06T00:00:00Z"));
  stamp(drop, Date.parse("2026-01-06T01:00:00Z"));

  const map = listSessions({ agent: "opencode", projectDir, home });

  assert.equal(map.sessions.length, 1);
  assert.equal(map.sessions[0].id, "sess-1");
  assert.equal(map.sessions[0].path, s1);
  assert.equal(map.sessions[0].current, true);
});

test("an unsupported agent is skipped with its reason and lists nothing", () => {
  const map = listSessions({ agent: "cursor", projectDir: "/tmp/x", home });

  assert.equal(map.skipped, true);
  assert.ok(map.reason);
  assert.deepEqual(map.sessions, []);
});

test("an empty project returns an empty map without inventing current", () => {
  const projectDir = mkdtempSync(join(tmpdir(), "rule-mcp-sessions-empty-"));
  const map = listSessions({ agent: "claude", projectDir, home });

  assert.deepEqual(map.sessions, []);
  assert.equal(map.currentUnknown, false);

  rmSync(projectDir, { recursive: true, force: true });
});
