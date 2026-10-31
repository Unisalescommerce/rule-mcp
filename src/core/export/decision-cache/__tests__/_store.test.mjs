/**
@module test/export/decision-cache/store

EX-04/EX-08: export-owned decision-cache - schemaVersion, status machine, NO_CACHE.
*/

import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { withEnv, withHome } from "../../../../shared/_testkit.js";

const {
  SCHEMA_VERSION,
  putDecision,
  getDecision,
  setDecisionStatus,
  listDecisions,
} = await import("../index.js");

test("putDecision persists schemaVersion and round-trips by fingerprint", () => {
  withHome(() => {
    const projectDir = mkdtempSync(join(tmpdir(), "rule-dc-"));

    const written = putDecision({
      projectDir,
      fingerprint: "fp-1",
      choice: { skill: "rule-process-tdd" },
      status: "pending",
      source: "rule-export-interview",
      agent: "claude",
    });

    assert.equal(written.ok, true);
    assert.equal(written.record.schemaVersion, SCHEMA_VERSION);

    const back = getDecision({ projectDir, fingerprint: "fp-1" });

    assert.equal(back.status, "pending");
    assert.equal(back.source, "rule-export-interview");
    assert.deepEqual(back.choice, { skill: "rule-process-tdd" });
    assert.equal(back.agent, "claude");

    rmSync(projectDir, { recursive: true, force: true });
  }, "rule-mcp-dc-");
});

test("status transitions pending → confirmed → rejected", () => {
  withHome(() => {
    const projectDir = mkdtempSync(join(tmpdir(), "rule-dc-st-"));

    putDecision({
      projectDir,
      fingerprint: "fp-2",
      choice: "A",
      status: "pending",
      source: "rule-keep",
      agent: "pi",
    });

    assert.equal(setDecisionStatus({ projectDir, fingerprint: "fp-2", status: "confirmed" }).ok, true);
    assert.equal(getDecision({ projectDir, fingerprint: "fp-2" }).status, "confirmed");

    assert.equal(setDecisionStatus({ projectDir, fingerprint: "fp-2", status: "rejected" }).ok, true);
    assert.equal(getDecision({ projectDir, fingerprint: "fp-2" }).status, "rejected");

    assert.equal(setDecisionStatus({ projectDir, fingerprint: "fp-2", status: "pending" }).ok, true);
    assert.equal(getDecision({ projectDir, fingerprint: "fp-2" }).status, "pending");

    rmSync(projectDir, { recursive: true, force: true });
  }, "rule-mcp-dc-st-");
});

test("an unknown status is refused", () => {
  withHome(() => {
    const projectDir = mkdtempSync(join(tmpdir(), "rule-dc-bad-"));

    const result = putDecision({
      projectDir,
      fingerprint: "fp-3",
      choice: "x",
      status: "approved",
      source: "rule-keep",
      agent: "codex",
    });

    assert.equal(result.ok, false);
    assert.equal(getDecision({ projectDir, fingerprint: "fp-3" }), undefined);

    rmSync(projectDir, { recursive: true, force: true });
  }, "rule-mcp-dc-bad-");
});

test("RULE_MCP_NO_CACHE skips writes and reads empty", () => {
  withHome(() => {
    withEnv({ RULE_MCP_NO_CACHE: "1" }, () => {
      const projectDir = mkdtempSync(join(tmpdir(), "rule-dc-nc-"));

      const written = putDecision({
        projectDir,
        fingerprint: "fp-4",
        choice: "y",
        status: "confirmed",
        source: "rule-adr",
        agent: "opencode",
      });

      assert.equal(written.ok, false);
      assert.equal(written.reason, "NO_CACHE");
      assert.equal(getDecision({ projectDir, fingerprint: "fp-4" }), undefined);
      assert.deepEqual(listDecisions({ projectDir }), []);

      rmSync(projectDir, { recursive: true, force: true });
    });
  }, "rule-mcp-dc-nc-");
});
