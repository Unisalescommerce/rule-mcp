import assert from "node:assert/strict";
import test from "node:test";
import { GUARDRAILS } from "../index.js";

const rule = GUARDRAILS.find((item) => item.id === "secret-detection");
const token = "ghp_" + "aB3dE5fG7hI9jK1mN3pQ5rS7tU9vW1xY3zA5";

test("finds provider tokens and never returns the token", () => {
  const result = rule.check(`const value = "${token}";`, { fileName: "config.js" });

  assert.equal(result.pass, false);
  assert.match(result.detail.join(" "), /github-pat/);
  assert.ok(!JSON.stringify(result).includes(token));
});

test("generic assignment details do not reveal values", () => {
  const value = "mystery-secret-value";
  const result = rule.check(`const password = "${value}";`, {});

  assert.equal(result.pass, false);
  assert.ok(!JSON.stringify(result).includes(value));
});

test("does not report clean environment access", () => {
  assert.equal(rule.check("const password = process.env.PASSWORD;", {}).pass, true);
});

test("nearby environment access does not suppress a hardcoded literal", () => {
  const result = rule.check("const x = process.env.X; const pass" + 'word = "unsafe-literal-value";', {});

  assert.equal(result.pass, false);
});

test("upstream path exclusion is honored", () => {
  assert.equal(rule.check(token, { fileName: "node_modules/@octokit/auth-token/README.md" }).pass, true);
});
