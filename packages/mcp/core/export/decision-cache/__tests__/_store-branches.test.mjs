/** A status change on a record that is not there, with a bad status, or with no cache. */
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { listDecisions, putDecision, setDecisionStatus } from "../_store.js";
import { withHome } from "rule-mcp-shared";

/** Run in a fresh home and a fresh project. */
function inProject(fn) {
  const projectDir = mkdtempSync(join(tmpdir(), "rule-mcp-decision-store-"));

  try {
    return withHome(() => fn(projectDir));
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
}

test("a status outside the set is refused", () => {
  inProject((projectDir) => {
    assert.deepEqual(setDecisionStatus({ projectDir, fingerprint: "x", status: "maybe" }), { ok: false, reason: "invalid" });
  });
});

test("a record that does not exist is reported as missing", () => {
  inProject((projectDir) => {
    assert.deepEqual(setDecisionStatus({ projectDir, fingerprint: "x", status: "confirmed" }), { ok: false, reason: "missing" });
  });
});

test("with the cache off a status change is refused", () => {
  inProject((projectDir) => {
    process.env.RULE_MCP_NO_CACHE = "1";

    try {
      assert.deepEqual(setDecisionStatus({ projectDir, fingerprint: "x", status: "confirmed" }), { ok: false, reason: "NO_CACHE" });
      assert.equal(Object.keys(listDecisions({ projectDir }) ?? {}).length, 0);
    } finally {
      delete process.env.RULE_MCP_NO_CACHE;
    }
  });
});

test("a decision with no agent stores and lists", () => {
  inProject((projectDir) => {
    putDecision({ projectDir, fingerprint: "f", choice: { route: "x" }, status: "pending", source: "rule-keep" });

    assert.ok(Object.keys(listDecisions({ projectDir })).length > 0);
  });
});
