/**
 * The three field gaps `adr new` used to refuse to carry: `endsWhen`, the
 * alternatives list and the supersede pair. Each one is a value the tool could
 * write and the caller had no way to pass.
 */
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import "../../../../../scripts/__tests__/fixtures/git-hermetic.mjs";

process.env.RULE_MCP_STATE_DIR = mkdtempSync(join(tmpdir(), "rule-mcp-adr-fields-state-"));
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

test("an endsWhen the caller wrote is kept verbatim, not the placeholder", async () => {
  const root = trunkProject("rule-mcp-adr-ends-");

  try {
    const result = await callTool("rule_tool_process_adr", {
      title: "Keep the sentence cap at 25 words",
      context: "The prose rules need one documented threshold.",
      decision: "Read 25 from the STE100 descriptive limit.",
      endsWhen: "A corpus where the field-based check cannot separate a right record from a wrong one.",
      projectDir: root,
    });

    assert.notEqual(result.isError, true, text(result));
    const [file] = adrs(root);
    const body = readFileSync(join(root, "docs", "adr", file), "utf8");

    assert.match(body, /## What would end this\n\nA corpus where the field-based check/, "the section carries the caller's text");
    assert.doesNotMatch(body, /The assumption this leans on/, "the placeholder is gone");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a superseded ADR with no successor is refused", async () => {
  const root = trunkProject("rule-mcp-adr-orphan-");

  try {
    const result = await callTool("rule_tool_process_adr", {
      title: "Replace the old cache",
      context: "The old cache is replaced by a newer one.",
      decision: "Supersede it.",
      status: "superseded",
      projectDir: root,
    });

    assert.equal(result.isError, true, "a superseded record with no successor is refused");
    assert.match(text(result), /must name|supersededBy/, "the refusal names the field to pass");
    assert.throws(() => adrs(root), /ENOENT/, "nothing is written");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("both directions of a supersede are written", async () => {
  const root = trunkProject("rule-mcp-adr-supersede-");

  try {
    const first = await callTool("rule_tool_process_adr", {
      title: "Use the first cache",
      context: "One cache, one key.",
      decision: "Adopt it.",
      projectDir: root,
    });
    assert.notEqual(first.isError, true, text(first));

    const second = await callTool("rule_tool_process_adr", {
      title: "Use the second cache",
      context: "The first cache is replaced.",
      decision: "Adopt the second cache and name the first as replaced.",
      supersedes: "001",
      projectDir: root,
    });
    assert.notEqual(second.isError, true, text(second));

    const [, replacement] = adrs(root).sort();
    assert.match(readFileSync(join(root, "docs", "adr", replacement), "utf8"), /- \*\*Supersedes\*\*: \[001\]/, "the new record names what it replaces");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
