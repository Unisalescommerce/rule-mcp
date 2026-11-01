/**
@module test/export/cleanup

Step 6 (EX-01, EX-06): hard-delete outside keep-set = newest N ∪ {current}.
Never touches real HOME; fixtures only.
*/

import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { withEnv, withHome } from "rule-mcp-shared";

const { keepSet, planCleanup, runCleanup } = await import("../index.js");

function stamp(file, ms) {
  const at = new Date(ms);

  utimesSync(file, at, at);
}

function writeClaudeSessions(home, projectDir, ids) {
  const dir = join(home, ".claude", "projects", projectDir.replaceAll("/", "-"));
  mkdirSync(dir, { recursive: true });

  return ids.map(({ id, at }) => {
    const file = join(dir, `${id}.jsonl`);

    writeFileSync(file, "{}\n");
    stamp(file, at);

    return file;
  });
}

test("keepSet is newest N union current", () => {
  const sessions = [
    { id: "a", mtime: 1, current: false },
    { id: "b", mtime: 2, current: false },
    { id: "c", mtime: 3, current: true },
    { id: "d", mtime: 4, current: false },
  ];

  const kept = keepSet(sessions, { keep: 2 });

  assert.deepEqual([...kept].sort(), ["c", "d"].sort(), "newest 2 includes current even if not newest alone - here c current + d newest");
});

test("keepSet still retains current when it is outside the newest N", () => {
  const sessions = [
    { id: "old-current", mtime: 1, current: true },
    { id: "n1", mtime: 10, current: false },
    { id: "n2", mtime: 20, current: false },
    { id: "n3", mtime: 30, current: false },
  ];

  const kept = keepSet(sessions, { keep: 2 });

  assert.ok(kept.has("old-current"));
  assert.ok(kept.has("n3"));
  assert.ok(kept.has("n2"));
  assert.equal(kept.size, 3);
});

test("planCleanup refuses when currentUnknown without inventing a victim", () => {
  const plan = planCleanup({
    agent: "claude",
    sessions: [
      { id: "a", path: "/tmp/a", mtime: 1 },
      { id: "b", path: "/tmp/b", mtime: 1 },
    ],
    currentUnknown: true,
    keep: 1,
  });

  assert.equal(plan.ok, false);
  assert.equal(plan.reason, "currentUnknown");
  assert.deepEqual(plan.delete, []);
});

test("planCleanup skips unsupported agents with their reason", () => {
  const plan = planCleanup({
    agent: "cursor",
    sessions: [],
    currentUnknown: false,
    keep: 5,
    skippedReason: "Cursor keeps its conversation history in an application database, with no documented usage schema.",
  });

  assert.equal(plan.ok, false);
  assert.equal(plan.skipped, true);
  assert.ok(plan.reason);
  assert.deepEqual(plan.delete, []);
});

test("runCleanup hard-deletes only outside the keep-set when confirmed", () => {
  withHome((ruleHome) => {
    withEnv({ RULE_MCP_EXPORT_KEEP_SESSIONS: "2" }, () => {
      const projectDir = mkdtempSync(join(tmpdir(), "rule-cleanup-"));
      const agents = join(ruleHome, "agents");
      const [old, mid, neu] = writeClaudeSessions(agents, projectDir, [
        { id: "old", at: Date.parse("2026-01-01T00:00:00Z") },
        { id: "mid", at: Date.parse("2026-01-02T00:00:00Z") },
        { id: "neu", at: Date.parse("2026-01-03T00:00:00Z") },
      ]);

      const result = runCleanup({
        agent: "claude",
        projectDir,
        home: agents,
        confirmed: true,
      });

      assert.equal(result.ok, true);
      assert.equal(existsSync(old), false, "oldest outside keep-set is gone");
      assert.equal(existsSync(mid), true);
      assert.equal(existsSync(neu), true);

      rmSync(projectDir, { recursive: true, force: true });
    });
  }, "rule-mcp-cleanup-");
});

test("runCleanup does nothing without confirmed", () => {
  withHome((ruleHome) => {
    const projectDir = mkdtempSync(join(tmpdir(), "rule-cleanup-nc-"));
    const agents = join(ruleHome, "agents");
    const [old, neu] = writeClaudeSessions(agents, projectDir, [
      { id: "old", at: Date.parse("2026-01-01T00:00:00Z") },
      { id: "neu", at: Date.parse("2026-01-03T00:00:00Z") },
    ]);

    const result = runCleanup({
      agent: "claude",
      projectDir,
      home: agents,
      confirmed: false,
      keep: 1,
    });

    assert.equal(result.ok, false);
    assert.equal(result.reason, "unconfirmed");
    assert.equal(existsSync(old), true);
    assert.equal(existsSync(neu), true);

    rmSync(projectDir, { recursive: true, force: true });
  }, "rule-mcp-cleanup-nc-");
});
