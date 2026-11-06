/** process_adr refuses mid-task writes under the default handoff policy. */
import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-adr-gate-"));
const project = join(home, "repo");

process.env.HOME = home;
process.env.RULE_MCP_HOME = join(home, ".rule-mcp");
delete process.env.RULE_MCP_ADR_POLICY;
process.env.RULE_MCP_DISABLE_AUTO_ADR = "1";

mkdirSync(project, { recursive: true });

test.after(() => {
  delete process.env.RULE_MCP_ADR_POLICY;
  rmSync(home, { recursive: true, force: true });
});

const { callTool } = await import("../../router/index.js");
const { registerProcessAdrTool } = await import("../_register.js");

registerProcessAdrTool();

test("mid-task process_adr under handoff answers Not written", async () => {
  const result = await callTool("rule_tool_process_adr", {
    title: "Use a policy gate for mid-task ADRs",
    projectDir: project,
    moment: "task",
  });
  const text = result.content.map((part) => part.text).join("\n");

  assert.match(text, /Not written/);
  assert.match(text, /handoff/i);
  assert.equal(
    readdirSync(project, { withFileTypes: true }).some((entry) => entry.name === "docs"),
    false,
  );
});

test("handoff moment under handoff policy writes the ADR", async () => {
  const result = await callTool("rule_tool_process_adr", {
    title: "Record the decision at handoff",
    projectDir: project,
    moment: "handoff",
  });
  const text = result.content.map((part) => part.text).join("\n");

  assert.match(text, /created:/i);
  // No git trunk here → pending path (numbers land on trunk).
  assert.ok(readdirSync(join(project, "docs", "adr", "_pending")).some((name) => name.endsWith(".md")));
});

test("full policy allows a mid-task write", async () => {
  process.env.RULE_MCP_ADR_POLICY = "full";

  const result = await callTool("rule_tool_process_adr", {
    title: "Allow mid-task ADRs under full policy",
    projectDir: project,
    moment: "task",
  });
  const text = result.content.map((part) => part.text).join("\n");

  assert.match(text, /created:/i);
  assert.match(text, /ADR record-the-decision|ADR allow-mid-task|Pending:/i);
  delete process.env.RULE_MCP_ADR_POLICY;
});
