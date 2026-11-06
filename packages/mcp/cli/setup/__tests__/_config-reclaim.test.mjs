/**
@module test/setup/config-reclaim

Uninstall removes rule-mcp from agent configs but left the switches and the
records it wrote, so a reinstall read a decision the user never made and the
"unknown" state could not be reached again. The reclaim lists every file
rule-mcp itself owns, removes them, and asks first unless the caller is
non-interactive or says to keep the configuration.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "rule-reclaim-home-"));
process.env.RULE_MCP_HOME = home;
process.env.HOME = home;

const { reclaimConfiguration, reclaimConfig, reclaimTargets } = await import("../_config-reclaim.js");
const { manifestPath } = await import("../../install/_manifest.js");
const { projectsPath } = await import("../../install/_projects.js");
const { ENV_CONFIG_FILE, LEGACY_ENV_CONFIG_FILE } = await import("../../installers/_env.js");

const writeFile = (path, body) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
};

const seed = () => {
  writeFile(ENV_CONFIG_FILE(), '{"RULE_MCP_NO_TOKENSAVE":"1"}\n');
  writeFile(LEGACY_ENV_CONFIG_FILE, '{"RULE_MCP_NO_TOKENSAVE":"0"}\n');
  writeFile(manifestPath(), '{"version":2,"agents":[]}\n');
  writeFile(projectsPath(), '{"version":1,"projects":{}}\n');
};

const clear = () => {
  for (const path of [ENV_CONFIG_FILE(), LEGACY_ENV_CONFIG_FILE, manifestPath(), projectsPath()]) {
    rmSync(path, { force: true });
  }
};

test.after(() => rmSync(home, { recursive: true, force: true }));
test.beforeEach(() => clear());
test.afterEach(() => clear());

test("the reclaim names every file rule-mcp wrote, absent ones included", () => {
  const absent = reclaimTargets();

  assert.equal(absent.length, 4);
  assert.ok(
    absent.every((target) => target.exists === false),
    "an absent file is listed as absent, not dropped from the list",
  );

  seed();

  const present = reclaimTargets();

  assert.ok(
    present.every((target) => target.exists),
    `every seeded file is found: ${JSON.stringify(present)}`,
  );
  assert.deepEqual(present.map((target) => target.id).sort(), ["env-config", "legacy-env-config", "manifest", "projects"]);
});

test("a dry run reports what it would delete and deletes nothing", () => {
  seed();

  const results = reclaimConfig({ dryRun: true });

  assert.ok(results.every((entry) => entry.status === "planned"));
  assert.ok(existsSync(ENV_CONFIG_FILE()), "a dry run leaves the switches alone");
});

test("the real thing removes them, and says so", () => {
  seed();

  const results = reclaimConfig();

  assert.ok(
    results.every((entry) => entry.status === "removed"),
    JSON.stringify(results),
  );
  assert.equal(existsSync(ENV_CONFIG_FILE()), false);
  assert.equal(existsSync(LEGACY_ENV_CONFIG_FILE), false);
  assert.equal(existsSync(manifestPath()), false);
  assert.equal(existsSync(projectsPath()), false);
});

test("a no at the prompt keeps the configuration", async () => {
  seed();

  const results = await reclaimConfiguration({ confirm: () => false });

  assert.ok(
    results.every((entry) => entry.status === "kept"),
    JSON.stringify(results),
  );
  assert.ok(existsSync(ENV_CONFIG_FILE()));
});

test("a yes at the prompt removes it", async () => {
  seed();

  const results = await reclaimConfiguration({ confirm: () => true });

  assert.ok(results.every((entry) => entry.status === "removed"));
  assert.equal(existsSync(ENV_CONFIG_FILE()), false);
});

test("--keep-config keeps the switches and still drops the records", async () => {
  seed();

  const results = await reclaimConfiguration({ keepConfig: true, interactive: false });
  const statusOf = (id) => results.find((entry) => entry.id === id)?.status;

  assert.equal(statusOf("env-config"), "kept");
  assert.equal(statusOf("legacy-env-config"), "kept");
  assert.equal(statusOf("manifest"), "removed");
  assert.ok(existsSync(ENV_CONFIG_FILE()));
});

test("a json or non-interactive run does not wait on a prompt", async () => {
  seed();

  const asked = [];
  const confirm = () => {
    asked.push("asked");

    return false;
  };

  await reclaimConfiguration({ json: true, confirm });
  assert.deepEqual(asked, [], "json output has nobody to answer");

  seed();
  const results = await reclaimConfiguration({ interactive: false, confirm });

  assert.deepEqual(asked, []);
  assert.ok(results.some((entry) => entry.status === "removed"));
});
