/**
 * A caller that sends one alternative or one tag gets one whole item, not the
 * characters of the string: the array forms stay valid, and the ADR body keeps
 * the text the caller wrote.
 */
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import "../../../../../scripts/__tests__/fixtures/git-hermetic.mjs";

process.env.RULE_MCP_STATE_DIR = mkdtempSync(join(tmpdir(), "rule-mcp-adr-single-state-"));
process.env.RULE_MCP_NO_AUTOUPDATE = "1";
process.env.RULE_MCP_ADR_POLICY = "full";

const { registerProcessAdrTool } = await import("../_register.js");
const { callTool } = await import("../../router/index.js");
const { trunkProject } = await import("./_adr-trunk.fixture.mjs");

registerProcessAdrTool();

/** The single text body of a tool result. */
const text = (result) => result.content.map((part) => part.text).join("\n");

/** The ADR files a project directory holds, excluding the index. */
const adrs = (root) => readdirSync(join(root, "docs", "adr")).filter((name) => name !== "ADR.md");

test("single alternative and tag strings are written as whole items", async () => {
  const root = trunkProject("rule-mcp-adr-single-");

  try {
    const result = await callTool("rule_tool_process_adr", {
      title: "Choose a database",
      alternatives: "Use a file",
      tags: "storage",
      projectDir: root,
    });
    assert.notEqual(result.isError, true, text(result));
    const body = readFileSync(join(root, "docs", "adr", adrs(root)[0]), "utf8");

    assert.match(body, /Use a file/);
    assert.match(body, /storage/);
    assert.doesNotMatch(body, /1\. U\n/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
