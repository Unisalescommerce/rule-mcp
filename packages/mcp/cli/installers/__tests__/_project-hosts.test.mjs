/**
 * Project-scope host path table: every documented project file, and none for
 * hosts that have no project config.
 */
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { test } from "node:test";

import { PROJECT_HOSTS, PROJECT_HOST_IDS, NO_PROJECT_HOSTS, projectHostFile, projectHostLocalFile, projectHostFormat } from "../_project-hosts.data.js";

test("every project host declares a shared file, a dialect, and optional local", () => {
  const expected = {
    claude: { file: ".mcp.json", format: "mcpServers", local: "~/.claude.json" },
    copilot: { file: ".mcp.json", format: "mcpServers" },
    pi: { file: ".mcp.json", format: "mcpServers" },
    codex: { file: ".codex/config.toml", format: "toml_table" },
    cursor: { file: ".cursor/mcp.json", format: "mcpServers" },
    vscode: { file: ".vscode/mcp.json", format: "servers" },
    gemini: { file: ".gemini/settings.json", format: "mcpServers" },
    qwen: { file: ".qwen/settings.json", format: "mcpServers" },
    roo: { file: ".roo/mcp.json", format: "mcpServers" },
    kiro: { file: ".kiro/settings/mcp.json", format: "mcpServers" },
    droid: { file: ".factory/mcp.json", format: "mcpServers" },
    devin: { file: ".devin/mcp_config.json", format: "mcpServers", local: ".devin/mcp_config.local.json" },
    kimi: { file: ".kimi-code/mcp.json", format: "mcpServers" },
    vibe: { file: ".vibe/config.toml", format: "toml_array" },
    grok: { file: ".grok/config.toml", format: "toml_table" },
    opencode: { file: "opencode.json", format: "opencode" },
    zed: { file: ".zed/settings.json", format: "context_servers" },
    jetbrains: { file: ".junie/mcp/mcp.json", format: "mcpServers" },
  };

  assert.deepEqual([...PROJECT_HOST_IDS].sort(), Object.keys(expected).sort(), "the catalog of project hosts");

  for (const [id, want] of Object.entries(expected)) {
    const row = PROJECT_HOSTS[id];

    assert.equal(row.file, want.file, `${id}: shared file`);
    assert.equal(row.format, want.format, `${id}: dialect`);
    assert.equal(row.local ?? null, want.local ?? null, `${id}: local file`);
    assert.equal(projectHostFormat(id), want.format, `${id}: format helper`);
  }
});

test("hosts without a documented project file are listed and absent from the table", () => {
  assert.deepEqual([...NO_PROJECT_HOSTS].sort(), ["antigravity", "cline", "emacs", "neovim"].sort());

  for (const id of NO_PROJECT_HOSTS) {
    assert.equal(PROJECT_HOSTS[id], undefined, `${id}: no project row`);
    assert.equal(projectHostFile(id, "/tmp/p"), null, `${id}: no shared path`);
  }
});

test("projectHostFile resolves under the project root; home-local stays absolute", () => {
  const root = "/tmp/try-project";

  assert.equal(projectHostFile("cursor", root), join(root, ".cursor", "mcp.json"));
  assert.equal(projectHostFile("jetbrains", root), join(root, ".junie", "mcp", "mcp.json"));
  assert.equal(projectHostFile("opencode", root), join(root, "opencode.json"));
  assert.equal(projectHostLocalFile("devin", root), join(root, ".devin", "mcp_config.local.json"));
  assert.match(projectHostLocalFile("claude", root), /\.claude\.json$/);
  assert.equal(projectHostLocalFile("cursor", root), null, "cursor has no local project file");
});
