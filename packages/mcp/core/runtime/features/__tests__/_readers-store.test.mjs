/**
 * Feature readers and the RULE_MCP_HOME env.json store.
 */
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { readAllLevels, readLevel } from "../_readers.js";
import { applyEnvPatch, envConfigPath, mergedEnv, readSavedEnv } from "../_store.js";
import { setFeatureLevel } from "../_apply.js";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-features-"));

test.after(() => rmSync(home, { recursive: true, force: true }));

test("readers honor legacy opt-out keys", () => {
  assert.equal(readLevel("adr", {}), "on");
  assert.equal(readLevel("adr", { RULE_MCP_NO_ADR: "1" }), "off");
  assert.equal(readLevel("telemetry", { RULE_MCP_NO_TELEMETRY: "1" }), "off");
  assert.equal(readLevel("telemetry", { RULE_MCP_NO_PROMPTS: "1" }), "anonymous");
  assert.equal(readLevel("update", { RULE_MCP_AUTO_UPDATE: "upgrade" }), "auto");
  assert.equal(readLevel("tokensave", { RULE_MCP_TOKENSAVE_AUTOTRACK: "1" }), "autotrack");
  assert.equal(readLevel("minimal-tools", { RULE_MCP_MINIMAL_TOOLS: "1" }), "on");
});

test("setFeatureLevel writes under RULE_MCP_HOME/config/env.json", () => {
  const result = setFeatureLevel("telemetry", "anonymous", { homeDir: home });

  assert.equal(result.level, "anonymous");
  assert.equal(result.path, envConfigPath(home));
  const saved = JSON.parse(readFileSync(result.path, "utf8"));

  assert.equal(saved.RULE_MCP_NO_PROMPT_TEXT, "1", "the level writes the key that is about the prompt text");
  assert.equal(saved.RULE_MCP_NO_PROMPTS, undefined, "and leaves the slash-menu key alone");
  assert.equal(saved.RULE_MCP_TELEMETRY_ANONYMOUS, "1");
  assert.equal("RULE_MCP_NO_TELEMETRY" in saved, false);
  assert.equal(readLevel("telemetry", mergedEnv({ homeDir: home, env: {} })), "anonymous");
});

test("disable clears keys that the off level nulls", () => {
  setFeatureLevel("minimal-tools", "on", { homeDir: home });
  assert.equal(readSavedEnv({ homeDir: home }).RULE_MCP_MINIMAL_TOOLS, "1");

  const off = setFeatureLevel("minimal-tools", "disable", { homeDir: home });

  assert.equal(off.level, "off");
  assert.equal("RULE_MCP_MINIMAL_TOOLS" in readSavedEnv({ homeDir: home }), false);
});

test("dry-run does not touch the file", () => {
  const before = readAllLevels(mergedEnv({ homeDir: home, env: {} }));

  applyEnvPatch({ RULE_MCP_NO_ADR: "1" }, { homeDir: home, dryRun: true });
  assert.deepEqual(readAllLevels(mergedEnv({ homeDir: home, env: {} })), before);
});
