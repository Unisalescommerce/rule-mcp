/** JetBrains install lands in Junie's user MCP file, never under the cwd. */
import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-junie-"));
const project = mkdtempSync(join(tmpdir(), "rule-mcp-junie-cwd-"));
process.env.HOME = home;

const { installJetbrains, junieConfigPath } = await import("../_agents-ide.js");
const { hostRecord } = await import("../hosts/_core.js");
const { uninstallJetbrains } = await import("../_uninstall-hosts.js");

const ENTRY = "/tmp/fake-rule-mcp.js";
const realCwd = process.cwd();

test.before(() => {
  process.chdir(project);
});

test.after(() => {
  process.chdir(realCwd);
  rmSync(home, { recursive: true, force: true });
  rmSync(project, { recursive: true, force: true });
});

test("junieConfigPath is ~/.junie/mcp/mcp.json under HOME", () => {
  assert.equal(junieConfigPath(), join(home, ".junie", "mcp", "mcp.json"));
});

test("hostRecord(jetbrains) points at the Junie file", () => {
  assert.equal(hostRecord("jetbrains").server.file, join(home, ".junie", "mcp", "mcp.json"));
});

test("installJetbrains writes the Junie file and nothing under the cwd", () => {
  mkdirSync(join(project, ".idea"), { recursive: true });

  const results = installJetbrains({ entrypoint: ENTRY, dryRun: false, global: false });
  const junie = join(home, ".junie", "mcp", "mcp.json");

  assert.equal(results[0], junie, "the install report names the Junie path");
  assert.ok(existsSync(junie), "the entry lands under ~/.junie");
  assert.match(readFileSync(junie, "utf8"), /rule-mcp/);
  assert.equal(existsSync(join(project, ".idea", "mcp.json")), false, "nothing is written under the project .idea");
});

test("uninstallJetbrains clears the Junie entry and never touches .idea", () => {
  const idea = join(project, ".idea", "mcp.json");
  mkdirSync(join(project, ".idea"), { recursive: true });
  // A leftover from an older install must stay: uninstall never sweeps project dirs.
  const leftover = '{"mcpServers":{"other":"keep"}}';
  writeFileSync(idea, leftover);

  uninstallJetbrains({ dryRun: false });

  const junie = join(home, ".junie", "mcp", "mcp.json");
  assert.doesNotMatch(readFileSync(junie, "utf8"), /rule-mcp/);
  assert.equal(readFileSync(idea, "utf8"), leftover, "project .idea is left alone");
});
