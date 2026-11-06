/**
 * `feature list|enable|disable` persists under RULE_MCP_HOME and can skip refresh.
 */
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { featureDisableCommand, featureEnableCommand, featureListCommand } from "../commands/_feature.js";
import { envConfigPath } from "../../core/runtime/features/_store.js";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-feature-cmd-"));
const lines = [];
const originalWrite = process.stdout.write.bind(process.stdout);

test.before(() => {
  process.stdout.write = (chunk, ...rest) => {
    lines.push(String(chunk));

    return true;
  };
});

test.after(() => {
  process.stdout.write = originalWrite;
  rmSync(home, { recursive: true, force: true });
});

test.beforeEach(() => {
  lines.length = 0;
});

test("enable writes the level and reports a dry-run without refresh", async () => {
  let refreshed = 0;
  const refresh = async () => {
    refreshed += 1;

    return { global: 0, projects: 0 };
  };

  await featureEnableCommand({
    id: "minimal-tools",
    level: "on",
    dryRun: true,
    homeDir: home,
    refresh,
  });

  assert.equal(refreshed, 0);
  assert.match(lines.join(""), /Would set minimal-tools=on/);
});

test("enable persists and calls refresh when the level changes", async () => {
  let refreshed = 0;
  const refresh = async () => {
    refreshed += 1;

    return { global: 1, projects: 0 };
  };

  await featureEnableCommand({
    id: "telemetry",
    level: "anonymous",
    homeDir: home,
    refresh,
  });

  const saved = JSON.parse(readFileSync(envConfigPath(home), "utf8"));

  assert.equal(saved.RULE_MCP_TELEMETRY_ANONYMOUS, "1");
  assert.equal(refreshed, 1);
  assert.match(lines.join(""), /Re-applied 1 global/);
});

test("disable turns a feature off", async () => {
  await featureDisableCommand({
    id: "adr",
    homeDir: home,
    refresh: async () => ({ global: 0, projects: 0 }),
  });

  const saved = JSON.parse(readFileSync(envConfigPath(home), "utf8"));

  assert.equal(saved.RULE_MCP_NO_ADR, "1");
});

test("list prints every feature", () => {
  featureListCommand({ homeDir: home });
  const text = lines.join("");

  assert.match(text, /adr=/);
  assert.match(text, /telemetry=/);
  assert.match(text, /minimal-tools=/);
});
