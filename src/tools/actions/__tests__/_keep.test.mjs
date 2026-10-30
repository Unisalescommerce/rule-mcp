/**
@module test/tools/actions/keep

Step 4.3: rule_tool_keep writes a confirmed decision into the export cache.
*/

import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { withHome } from "../../../shared/_testkit.js";

const state = mkdtempSync(join(tmpdir(), "rule-keep-tool-"));

process.env.RULE_MCP_STATE_DIR = state;
process.env.RULE_MCP_NO_AUTOUPDATE = "1";
delete process.env.RULE_MCP_NO_CACHE;

const { registerKeepTool } = await import("../_keep.js");
const { callTool } = await import("../../router/index.js");
const { getDecision } = await import("../../../core/export/decision-cache/index.js");

registerKeepTool();

test.after(() => rmSync(state, { recursive: true, force: true }));

const text = (result) => result.content.map((part) => part.text).join("\n");

test("rule_tool_keep confirms a decision in the export decision-cache", async () => {
  await withHome(async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "rule-keep-proj-"));

    const result = await callTool("rule_tool_keep", {
      fingerprint: "fp-keep-1",
      choice: JSON.stringify({ skill: "rule-process-tdd" }),
      agent: "claude",
      projectDir,
    });

    assert.notEqual(result.isError, true, text(result));
    assert.match(text(result), /confirmed/i);

    const record = getDecision({ projectDir, fingerprint: "fp-keep-1" });

    assert.equal(record.status, "confirmed");
    assert.equal(record.source, "rule-keep");
    assert.deepEqual(record.choice, { skill: "rule-process-tdd" });

    rmSync(projectDir, { recursive: true, force: true });
  }, "rule-mcp-keep-tool-");
});

test("rule_tool_keep refuses when NO_CACHE is set", async () => {
  await withHome(async () => {
    process.env.RULE_MCP_NO_CACHE = "1";

    try {
      const projectDir = mkdtempSync(join(tmpdir(), "rule-keep-nc-"));
      const result = await callTool("rule_tool_keep", {
        fingerprint: "fp-keep-nc",
        choice: "x",
        projectDir,
      });

      assert.equal(result.isError, true);
      assert.match(text(result), /NO_CACHE/);

      rmSync(projectDir, { recursive: true, force: true });
    } finally {
      delete process.env.RULE_MCP_NO_CACHE;
    }
  }, "rule-mcp-keep-nc-");
});
