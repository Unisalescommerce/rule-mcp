/** Manifest hosts[].written records project files so uninstall can reverse them. */
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-manifest-written-"));
process.env.HOME = home;
process.env.RULE_MCP_HOME = home;

const { recordInstall, readManifest, forgetInstall } = await import("../_manifest.js");

test.after(() => rmSync(home, { recursive: true, force: true }));

test("recordInstall merges written paths onto the host entry", () => {
  recordInstall({
    agent: "cursor",
    level: "L1",
    written: ["/tmp/a/.cursor/mcp.json"],
    dryRun: false,
  });
  recordInstall({
    agent: "cursor",
    written: ["/tmp/b/.cursor/mcp.json", "/tmp/a/.cursor/mcp.json"],
    dryRun: false,
  });

  const host = readManifest().hosts.cursor;

  assert.equal(host.level, "L1");
  assert.deepEqual(host.written, ["/tmp/a/.cursor/mcp.json", "/tmp/b/.cursor/mcp.json"]);
});

test("forgetInstall drops the host and its written list", () => {
  forgetInstall({ agent: "cursor", dryRun: false });

  assert.equal(readManifest().hosts.cursor, undefined);
});
