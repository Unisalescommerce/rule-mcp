/** Branch coverage for the ADR tool's nullish defaults. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import "../../../../../tests/fixtures/git-hermetic.mjs";

process.env.RULE_MCP_STATE_DIR = mkdtempSync(join(tmpdir(), "rule-mcp-adr-branches-"));
process.env.RULE_MCP_NO_AUTOUPDATE = "1";
process.env.RULE_MCP_ADR_POLICY = "full";
process.env.RULE_MCP_NO_TELEMETRY = "1";
process.env.RULE_MCP_NO_CACHE = "1";

const { registerProcessAdrTool } = await import("../_register.js");
const { callTool } = await import("../../router/index.js");

registerProcessAdrTool();

/**
 * A project on a trunk: numbering happens on trunk, and a bare directory is off
 * one, so this test asserted a number against the pending path (ADR 196).
 */
const trunkProject = (prefix) => {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const git = (...arguments_) => execFileSync("git", arguments_, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

  git("init", "--initial-branch=main", "-q");
  git("config", "user.email", "fixture@example.com");
  git("config", "user.name", "Fixture");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git("add", "-A");
  git("commit", "-qm", "chore(fixture): initial");

  return root;
};

test("missing optional fields fall back to the defaults", async () => {
  const root = trunkProject("rule-mcp-adr-proj-");

  try {
    const result = await callTool("rule_tool_process_adr", {
      title: "Prefer the defaults when the caller omits them",
      projectDir: root,
    });

    assert.equal(result.isError, undefined);
    assert.match(result.content[0].text, /Status: accepted/u);
    assert.match(result.content[0].text, /Tags: architecture/u);
    assert.match(readFileSync(join(root, "docs", "adr", "001-prefer-the-defaults-when-the-caller-omits-them.md"), "utf8"), /## Context/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
