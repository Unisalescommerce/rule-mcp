/**
@module test/tools/actions/keep

Step 4.3: rule_tool_keep writes a confirmed decision into the export cache.
*/

import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

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

/**
 * Run an async body with `RULE_MCP_HOME` pointed at a fresh temp dir.
 *
 * `withHome` restores the variable as soon as the callback returns, and an
 * async callback returns a promise immediately, so the tool call inside it ran
 * against the real home and the assertion read an empty store. Awaiting the
 * body first is what makes the isolation real.
 *
 * @param {() => Promise<unknown>} fn
 * @param {string} prefix
 */
async function withAsyncHome(fn, prefix) {
  const home = mkdtempSync(join(tmpdir(), prefix));
  const previous = process.env.RULE_MCP_HOME;

  process.env.RULE_MCP_HOME = home;

  try {
    await fn(home);
  } finally {
    if (previous === undefined) {
      delete process.env.RULE_MCP_HOME;
    } else {
      process.env.RULE_MCP_HOME = previous;
    }

    rmSync(home, { recursive: true, force: true });
  }
}

test("rule_tool_keep confirms a decision in the export decision-cache", async () => {
  await withAsyncHome(async () => {
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
  await withAsyncHome(async () => {
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
