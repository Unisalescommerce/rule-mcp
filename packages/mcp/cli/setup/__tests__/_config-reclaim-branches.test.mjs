/**
 * Config reclaim with nothing to do, with a refusal, and with the switches kept.
 *
 * The home is fixed for the whole file, before the module loads. `withHome`
 * restores the variable when its callback returns, so an async callback runs
 * its second half against the real home, and this code deletes files.
 */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-reclaim-home-"));

process.env.RULE_MCP_HOME = home;
process.env.HOME = home;
process.env.USERPROFILE = home;
process.env.XDG_CONFIG_HOME = join(home, ".config");

const { reclaimConfig, reclaimConfiguration, reclaimTargets } = await import("../_config-reclaim.js");

test.after(() => rmSync(home, { recursive: true, force: true }));

/** Create one reclaimable file and return its target. */
function seed() {
  const [target] = reclaimTargets();

  assert.ok(target.file.startsWith(home), "the test must never reach a real home");
  mkdirSync(dirname(target.file), { recursive: true });
  writeFileSync(target.file, "{}");

  return target;
}

test("every target sits under the test home", () => {
  for (const target of reclaimTargets()) {
    assert.ok(target.file.startsWith(home), `${target.id} escapes the test home: ${target.file}`);
  }
});

test("an absent target says so", () => {
  assert.ok(reclaimConfig({ dryRun: true }).every((result) => result.status === "absent"));
  assert.deepEqual(reclaimConfiguration.length, 0);
});

test("a refused question keeps every file", async () => {
  const target = seed();
  const results = await reclaimConfiguration({ interactive: true, confirm: async () => false });

  assert.equal(results.find((result) => result.id === target.id).status, "kept");
});

test("a dry run plans, and an accepted question removes", async () => {
  const target = seed();

  assert.equal((await reclaimConfiguration({ dryRun: true })).find((result) => result.id === target.id).status, "planned");

  const results = await reclaimConfiguration({ interactive: true, confirm: async () => true });

  assert.equal(results.find((result) => result.id === target.id).status, "removed");
});

test("keepConfig keeps the switches files", async () => {
  const target = seed();

  assert.equal((await reclaimConfiguration({ keepConfig: true, json: true })).find((result) => result.id === target.id).status, "kept");
});
