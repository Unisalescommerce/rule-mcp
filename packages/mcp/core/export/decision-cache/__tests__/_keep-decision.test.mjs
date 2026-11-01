/**
@module test/export/decision-cache/keep-decision

Step 4.3: keepDecision writes status confirmed with source rule-keep.
*/

import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { withHome } from "rule-mcp-shared";

const { keepDecision, getDecision } = await import("../index.js");

test("keepDecision stores a confirmed rule-keep record", () => {
  withHome(() => {
    const projectDir = mkdtempSync(join(tmpdir(), "rule-kd-"));

    const result = keepDecision({
      projectDir,
      fingerprint: "fp-kd-1",
      choice: { route: "rule-process-tdd" },
      agent: "pi",
    });

    assert.equal(result.ok, true);
    assert.equal(result.record.status, "confirmed");
    assert.equal(result.record.source, "rule-keep");

    const back = getDecision({ projectDir, fingerprint: "fp-kd-1" });

    assert.equal(back.status, "confirmed");
    assert.deepEqual(back.choice, { route: "rule-process-tdd" });

    rmSync(projectDir, { recursive: true, force: true });
  }, "rule-mcp-kd-");
});
