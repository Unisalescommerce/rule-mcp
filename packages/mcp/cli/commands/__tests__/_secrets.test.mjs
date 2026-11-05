/**
WS1-T4: `rule-mcp secrets` is the loud surface the hook deliberately is not.

The commit gate stays silent when betterleaks is not installed, because a
hook that asks on every commit until somebody installs a tool gets switched
off. This command is the other half of that policy: the absence is printed
here, in the place a person runs on purpose.

Three exits, and they are three different answers: 0 nothing found, 1
credentials found, 2 the scan did not run. A scan that did not run must never
look like a clean one, which is why it is not 0.
*/
import { strict as assert } from "node:assert";
import test from "node:test";

import { secretsCommand } from "../_secrets.js";

/** A run of the command with its output captured. */
function run({ probe = () => ({ available: true, supported: true, reason: "" }), staged = () => ({ scanned: true, findings: [], reason: "" }), ranged, ...options } = {}) {
  const out = [];
  const err = [];
  const code = secretsCommand(options, { probe, staged, ranged, write: (text) => out.push(text), writeError: (text) => err.push(text) });

  return { code, out: out.join(""), err: err.join("") };
}

test("an absent binary is loud and does not pretend to have scanned", () => {
  const { code, err } = run({ probe: () => ({ available: false, supported: false, reason: "betterleaks is not on PATH" }) });

  assert.equal(code, 2);
  assert.match(err, /nothing scanned/);
  assert.match(err, /betterleaks is not on PATH/);
  assert.match(err, /Install betterleaks v2/);
});

test("a clean patch says so and exits 0", () => {
  const { code, out } = run();

  assert.equal(code, 0);
  assert.match(out, /no credentials found/);
});

test("a finding is printed with its rule and place, and exits 1", () => {
  const staged = () => ({ scanned: true, reason: "", findings: [{ ruleId: "github-pat", description: "GitHub Personal Access Token", path: ".env", line: 3 }] });
  const { code, out } = run({ staged });

  assert.equal(code, 1);
  assert.match(out, /\.env:3 github-pat/);
  assert.match(out, /GitHub Personal Access Token/);
  assert.match(out, /1 finding/);
});

test("json mode prints the findings and keeps the exit code", () => {
  const staged = () => ({ scanned: true, reason: "", findings: [{ ruleId: "github-pat", description: "", path: ".env", line: 3 }] });
  const { code, out } = run({ staged, json: true });

  assert.equal(code, 1);
  assert.deepEqual(JSON.parse(out), [{ ruleId: "github-pat", description: "", path: ".env", line: 3 }]);
});

test("a scan that did not run exits 2, never 0", () => {
  const { code, err } = run({ staged: () => ({ scanned: false, findings: [], reason: "betterleaks exited 2" }) });

  assert.equal(code, 2);
  assert.match(err, /nothing scanned/);
  assert.match(err, /betterleaks exited 2/);
});

test("a range scans the range, not the index", () => {
  const ranges = [];
  const { code } = run({ range: "origin/main..HEAD", ranged: (range) => (ranges.push(range), { scanned: true, findings: [], reason: "" }) });

  assert.equal(code, 0);
  assert.deepEqual(ranges, ["origin/main..HEAD"]);
});

test("a directory is passed to the scan", () => {
  const seen = [];
  const staged = (options) => {
    seen.push(options);

    return { scanned: true, findings: [], reason: "" };
  };

  run({ staged, repo: "/tmp/other" });
  assert.equal(seen[0].cwd, "/tmp/other");
});
