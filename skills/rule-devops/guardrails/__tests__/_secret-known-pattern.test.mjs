import assert from "node:assert/strict";
import test from "node:test";
import { findKnownSecrets } from "../_secret-known-pattern.js";

const github = "ghp_" + "aB3dE5fG7hI9jK1mN3pQ5rS7tU9vW1xY3zA5";
const gitlab = "glpat-" + "A1b2C3d4E5f6G7h8I9j0";
const aws = "AKIA" + "2BCDEFGH3JKLMNPQ";

test("detects synthetic provider tokens without returning their values", () => {
  const findings = findKnownSecrets(`${github}\n${gitlab}\n${aws}`);

  assert.deepEqual(
    findings.map((item) => item.ruleId),
    ["github-pat", "gitlab-pat", "aws-access-token"],
  );
  assert.deepEqual(
    findings.map((item) => item.line),
    [1, 2, 3],
  );
  assert.ok(!JSON.stringify(findings).includes(github));
  assert.ok(!JSON.stringify(findings).includes(gitlab));
  assert.ok(!JSON.stringify(findings).includes(aws));
});

test("rejects truncated and low entropy candidates", () => {
  assert.deepEqual(findKnownSecrets("ghp_abc glpat-short AKIA" + "A".repeat(16)), []);
});

test("applies the upstream AWS example suffix filter", () => {
  assert.deepEqual(findKnownSecrets("AKIA" + "BCDEFGHJKEXAMPLE"), []);
});

test("applies the upstream path exclusion for GitHub tokens", () => {
  assert.deepEqual(findKnownSecrets(github, { fileName: "node_modules/@octokit/auth-token/README.md" }), []);
});

test("returns each finding once and refuses oversized input", () => {
  assert.equal(findKnownSecrets(`${github}\n${github}`).length, 2);
  assert.throws(() => findKnownSecrets("a".repeat(262145)), /262144/);
});
