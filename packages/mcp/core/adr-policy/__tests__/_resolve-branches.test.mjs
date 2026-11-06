/** Every shape a policy can arrive in, including the ones that mean nothing. */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { allowsAdrWrite, normalizeLevel, parsePolicyDocument, policyFingerprint, resolveAdrPolicy } from "../_resolve.js";

test("a level that names nothing normalizes to null", () => {
  assert.equal(normalizeLevel("nonsense"), null);
});

test("a blank or broken string is no policy", () => {
  assert.equal(parsePolicyDocument(" ".repeat(3)), null);
  assert.equal(parsePolicyDocument("{broken"), null);
  assert.equal(parsePolicyDocument("nonsense"), null);
});

test("a bare level is a policy with no categories", () => {
  assert.deepEqual(parsePolicyDocument("full"), { default: "full", categories: {} });
});

test("an object can name its level either way, or only categories", () => {
  assert.equal(parsePolicyDocument({ default: "full" }).default, "full");
  assert.equal(parsePolicyDocument({ level: "on-demand" }).default, "on-demand");
  assert.equal(parsePolicyDocument({}), null);

  const only = parsePolicyDocument({ categories: { schema: "full" } });

  assert.equal(only.categories.schema, "full");
  assert.equal(only.default, "handoff");
});

test("a project file that cannot be read falls through to the default", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-adr-policy-"));

  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, ".context"));
  writeFileSync(join(dir, ".context", "adr.json"), "{broken");

  assert.equal(resolveAdrPolicy({ projectDir: dir, env: {} }).default, "handoff");
});

test("on-demand allows a write only when the caller asks", () => {
  const policy = { default: "on-demand", categories: {} };

  assert.equal(allowsAdrWrite(policy), false);
  assert.equal(allowsAdrWrite(policy, { explicit: true }), true);
});

test("the fingerprint needs no categories and no argument", () => {
  assert.equal(typeof policyFingerprint({ default: "full" }), "string");
  assert.equal(typeof policyFingerprint(), "string");
});
