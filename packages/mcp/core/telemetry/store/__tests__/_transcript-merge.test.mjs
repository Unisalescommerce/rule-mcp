/**
@module test/telemetry/store/transcript-merge

EX-03: merging transcript usage into the store is digest-keyed and idempotent.
Two merges of the same window must leave stats unchanged.
*/

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { withHome } from "rule-mcp-shared";

const { mergeTranscriptTelemetry, readMergedUsage, usageDigest } = await import("../index.js");
const { aggregate } = await import("../../stats/index.js");

/** Minimal pi JSONL under a fake agents home for one project. */
function writePi(home, projectDir) {
  const slug = `--${projectDir.replace(/^\//, "").replaceAll("/", "-")}--`;
  const dir = join(home, ".pi", "agent", "sessions", slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "s1.jsonl"),
    [
      JSON.stringify({ type: "message", message: { role: "user", content: [{ type: "text", text: "hi" }] } }),
      JSON.stringify({
        type: "message",
        message: {
          role: "assistant",
          model: "m",
          usage: { input: 10, output: 5, cacheRead: 0, cacheWrite: 0, totalTokens: 15, cost: { total: 0.01 } },
        },
      }),
    ].join("\n") + "\n",
  );
}

test("a second merge of the same window is unchanged and keeps the same digest", () => {
  withHome((ruleHome) => {
    const projectDir = mkdtempSync(join(tmpdir(), "rule-merge-proj-"));
    const agents = join(ruleHome, "agents");
    writePi(agents, projectDir);

    const first = mergeTranscriptTelemetry({ projectDir, home: agents });
    const second = mergeTranscriptTelemetry({ projectDir, home: agents });

    assert.equal(first.status, "merged");
    assert.equal(second.status, "unchanged");
    assert.equal(first.digest, second.digest);
    assert.equal(readMergedUsage(projectDir)?.output, 5);
    assert.equal(readMergedUsage(projectDir)?.source, "transcript");

    const fingerprint = (usage) =>
      JSON.stringify({
        calls: aggregate([]).calls,
        output: usage?.output,
        apiCalls: usage?.apiCalls,
        digest: usage?.digest,
      });

    assert.equal(fingerprint(first.usage), fingerprint(second.usage), "stats view of the merge does not inflate");

    rmSync(projectDir, { recursive: true, force: true });
  }, "rule-mcp-merge-");
});

test("a different window produces a new digest and still does not double-count the first", () => {
  withHome((ruleHome) => {
    const projectDir = mkdtempSync(join(tmpdir(), "rule-merge-window-"));
    const agents = join(ruleHome, "agents");
    writePi(agents, projectDir);

    const until = Date.parse("2026-12-31T00:00:00Z");
    const open = mergeTranscriptTelemetry({ projectDir, home: agents, since: 0, until });
    const again = mergeTranscriptTelemetry({ projectDir, home: agents, since: 0, until });

    assert.equal(open.status, "merged");
    assert.equal(again.status, "unchanged");
    assert.notEqual(usageDigest({ projectDir, since: 0, until: 1, usage: open.usage }), open.digest, "a different window digests differently");

    rmSync(projectDir, { recursive: true, force: true });
  }, "rule-mcp-merge-w-");
});

test("no transcript yields empty without writing a ledger entry", () => {
  withHome(() => {
    const projectDir = mkdtempSync(join(tmpdir(), "rule-merge-empty-"));
    const result = mergeTranscriptTelemetry({ projectDir, home: join(tmpdir(), "no-agents") });

    assert.equal(result.status, "empty");
    assert.equal(readMergedUsage(), undefined);

    rmSync(projectDir, { recursive: true, force: true });
  }, "rule-mcp-merge-e-");
});
