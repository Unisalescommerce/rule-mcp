/** Runtime routing must not load the deferred Nyx integration. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relative) => readFileSync(new URL(relative, import.meta.url), "utf8");

test("the MCP package does not depend on the Nyx gateway", () => {
  const manifest = JSON.parse(read("../../../../package.json"));

  assert.equal(manifest.dependencies["nyx-gateway"], undefined);
});

test("routing and cache do not invoke the Nyx tiers", () => {
  assert.doesNotMatch(read("../../../../tools/ai/_register.js"), /nyx|rerankSkillScores/i);
  assert.doesNotMatch(read("../../../../tools/router/call/_stages.js"), /cacheLookupSemantic/);
  assert.doesNotMatch(read("../index.js"), /nyx/i);
});
