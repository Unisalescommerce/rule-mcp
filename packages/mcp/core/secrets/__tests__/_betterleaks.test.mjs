/**
WS1-T2.1: the scan reports findings, and reports "not scanned" when it could
not run.

The distinction is the whole point. A gate that turns a broken binary, a
timeout or a half-written report into an empty finding list has not scanned
anything and says the patch is clean, which is the one answer it must never
give for free. Every failure path here has to come back as `scanned: false`
with a reason the hook can print.
*/
import { strict as assert } from "node:assert";
import test from "node:test";

import { MAX_PATCH_BYTES, scanPatch } from "@mcp/core/secrets/index.js";

const DOCUMENT = {
  schema_version: "2.0.0",
  findings: [{ rule_id: "github-pat", description: "GitHub Personal Access Token", confidence: "high", location: { path: "src/config.ts", start_line: 12 } }],
};

/** An exec that answers the way a binary would, and records the call. */
function answering({ status = 0 } = {}) {
  const calls = [];
  const exec = (command, args, options) => {
    calls.push({ command, args, options });

    if (status !== 0) {
      const error = new Error(`Command failed: ${command} ${args.join(" ")}`);

      error.status = status;
      error.stderr = "parse error: unexpected end of patch\n";
      throw error;
    }

    return JSON.stringify(DOCUMENT);
  };

  return { exec, calls };
}

test("an empty patch is not scanned, and no process is spawned for it", () => {
  const { exec, calls } = answering();
  const result = scanPatch("   \n", { exec });

  assert.equal(result.scanned, true);
  assert.deepEqual(result.findings, []);
  assert.equal(calls.length, 0, "nothing staged means nothing to scan");
});

test("a finding comes back with the flags that make it offline and redacted", () => {
  const { exec, calls } = answering();
  const result = scanPatch("diff --git a/x b/x\n", { exec });

  assert.equal(result.scanned, true);
  assert.equal(result.findings.length, 1);
  assert.deepEqual(calls[0].args.slice(0, 1), ["stdin"]);
  assert.ok(calls[0].args.includes("--git-diff"));
  assert.ok(calls[0].args.includes("--redact"));
  assert.ok(calls[0].args.includes("--exit-code=0"), "findings must not be an error exit, or a scan failure cannot be told apart");
  assert.ok(!calls[0].args.includes("--validate"), "validation is a network request");
  assert.ok(!calls[0].args.includes("--analyze"), "analysis is a network request");
  assert.equal(calls[0].options.input, "diff --git a/x b/x\n");
  assert.ok(calls[0].options.timeout > 0);
});

test("a failed scan is reported, not swallowed", () => {
  const { exec } = answering({ status: 1 });
  const result = scanPatch("diff --git a/x b/x\n", { exec });

  assert.equal(result.scanned, false);
  assert.match(result.reason, /unexpected end of patch/);
  assert.deepEqual(result.findings, []);
});

test("a scan that is killed reports the timeout", () => {
  const exec = () => {
    const error = new Error("spawnSync betterleaks ETIMEDOUT");

    error.signal = "SIGKILL";
    throw error;
  };
  const result = scanPatch("diff --git a/x b/x\n", { exec });

  assert.equal(result.scanned, false);
  assert.match(result.reason, /did not answer/);
});

test("an oversize patch is refused before it reaches the binary", () => {
  const { exec, calls } = answering();
  const result = scanPatch("a".repeat(MAX_PATCH_BYTES + 1), { exec });

  assert.equal(result.scanned, false);
  assert.match(result.reason, /4 MiB/);
  assert.equal(calls.length, 0);
});
