/** The digest of a sparse usage record, and a ledger that cannot be trusted. */
import { strict as assert } from "node:assert";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { withHome } from "rule-mcp-shared";

const { getProjectPaths } = await import("@mcp/cli/paths/index.js");
const { mergeTranscriptTelemetry, readMergedUsage, usageDigest } = await import("../_transcript-merge.js");

test("a sparse record digests like the same record with its zeroes spelled out", () => {
  const sparse = usageDigest({ projectDir: "/p", usage: {} });
  const full = usageDigest({ projectDir: "/p", usage: { agent: null, input: 0, output: 0, apiCalls: 0, userTurns: 0, cacheRead: 0, cacheWrite: 0 } });

  assert.equal(sparse, full);
  assert.notEqual(
    sparse,
    usageDigest({ projectDir: "/p", since: 1, until: 2, usage: { agent: "pi", input: 1, output: 2, apiCalls: 3, userTurns: 4, cacheRead: 5, cacheWrite: 6 } }),
  );
});

test("no project means nothing to merge", () => {
  assert.deepEqual(mergeTranscriptTelemetry({}), { status: "empty" });
});

for (const [name, body] of [
  ["broken", "{broken"],
  ["shapeless", '{"digests":"nope"}'],
]) {
  test(`a ${name} ledger reads as empty`, () => {
    withHome((home) => {
      const { dir } = getProjectPaths(home);

      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "transcript-merge.json"), body);

      assert.equal(readMergedUsage(home), undefined);
    });
  });
}
