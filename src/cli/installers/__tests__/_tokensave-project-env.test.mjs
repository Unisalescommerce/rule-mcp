/**
@module test/installers/tokensave-project-env

A project-scope install writes the server env into the project's own config, so
it is the one place where "on when the graph is here, off when it is not" can be
decided per project instead of per user. A choice the user already recorded wins
over the guess, and a project that has a graph is left alone rather than pinned.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-home-"));
process.env.RULE_MCP_HOME = home;
// `readEnvConfig` also reads the legacy `~/.config/rule-mcp/env.json`, which on
// this machine is the real user's file: a test that inherited it would read a
// choice nobody made here.
process.env.HOME = home;

const { tokensaveProjectEnv, writeEnvConfig } = await import("../_env.js");
const { installProjectHost } = await import("../_install-project.js");

const withGraph = mkdtempSync(join(tmpdir(), "rule-project-graph-"));
mkdirSync(join(withGraph, ".tokensave"));
const withoutGraph = mkdtempSync(join(tmpdir(), "rule-project-plain-"));

test.after(() => {
  for (const dir of [home, withGraph, withoutGraph]) {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a project without a graph is pinned off, one with a graph is left alone", () => {
  assert.deepEqual(tokensaveProjectEnv(withoutGraph), { RULE_MCP_NO_TOKENSAVE: "1" });
  assert.deepEqual(tokensaveProjectEnv(withGraph), {});
});

test("an explicit off or autotrack is not overwritten by the guess", () => {
  writeEnvConfig({ RULE_MCP_NO_TOKENSAVE: "1" });
  assert.deepEqual(tokensaveProjectEnv(withGraph), {}, "an explicit off survives a project with a graph");

  writeEnvConfig({ RULE_MCP_TOKENSAVE_AUTOTRACK: "1" });
  assert.deepEqual(tokensaveProjectEnv(withoutGraph), {}, "an explicit autotrack survives a graphless project");

  writeEnvConfig({});
});

test("the zero every earlier install wrote is not a decision about this project", () => {
  writeEnvConfig({ RULE_MCP_NO_TOKENSAVE: "0" });
  assert.deepEqual(tokensaveProjectEnv(withoutGraph), { RULE_MCP_NO_TOKENSAVE: "1" }, "a historical default yields to the project");

  writeEnvConfig({});
});

test("a local project install carries the derived env into its own config", () => {
  const { written } = installProjectHost({
    agent: "devin",
    projectRoot: withoutGraph,
    projectConfig: "local",
  });
  const config = JSON.parse(readFileSync(written[0], "utf8"));
  const entry = config.mcpServers["rule-mcp"];

  assert.equal(entry.env?.RULE_MCP_NO_TOKENSAVE, "1", "the graphless project installs with tokensave off");
});

test("a project with a graph installs without the switch pinned", () => {
  const { written } = installProjectHost({
    agent: "devin",
    projectRoot: withGraph,
    projectConfig: "local",
  });
  const config = JSON.parse(readFileSync(written[0], "utf8"));

  assert.equal(config.mcpServers["rule-mcp"].env?.RULE_MCP_NO_TOKENSAVE, undefined);
});
