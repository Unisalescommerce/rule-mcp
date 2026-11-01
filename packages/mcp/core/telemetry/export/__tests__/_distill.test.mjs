/**
@module test/telemetry/export/distill

EX-07: distill-only export keeps MCP events by default; drain is opt-in.
*/

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { withEnv, withHome } from "rule-mcp-shared";

const { exportDistill } = await import("../index.js");
const { readEvents } = await import("../../store/index.js");
const telemetry = await import("../../recorder/index.js");
const { cacheClear, cacheLookup } = await import("../../../cache/tool-cache/index.js");

function writePi(home, projectDir) {
  const slug = `--${projectDir.replace(/^\//, "").replaceAll("/", "-")}--`;
  const dir = join(home, ".pi", "agent", "sessions", slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "s1.jsonl"),
    JSON.stringify({
      type: "message",
      message: { role: "assistant", model: "m", usage: { input: 1, output: 2, totalTokens: 3 } },
    }) + "\n",
  );
}

test("exportDistill defaults to keep and leaves the event log", () => {
  withHome((ruleHome) => {
    withEnv({ RULE_MCP_NO_TELEMETRY: undefined, RULE_MCP_NO_PROMPTS: "1" }, () => {
      const projectDir = mkdtempSync(join(tmpdir(), "rule-distill-"));
      mkdirSync(join(projectDir, ".git"), { recursive: true });
      const agents = join(ruleHome, "agents");
      writePi(agents, projectDir);

      const previous = process.cwd();
      process.chdir(projectDir);

      try {
        telemetry.startSession({ transport: "stdio", now: 1_000 });
        telemetry.recordToolCall({ tool: "rule_tool", durationMs: 3, ok: true, resultBytes: 10, now: 1_100 });
        telemetry.flush();
        telemetry.endSession({ now: 1_200 });

        const before = readEvents().length;
        assert.ok(before >= 1, "there is something to export");

        const result = exportDistill({ projectDir, home: agents, exportedAt: 2_000 });

        assert.equal(result.kept, true);
        assert.equal(result.drained, 0);
        assert.ok(result.file.endsWith(".flight"));
        assert.equal(readEvents().length, before, "default distill does not drain");
      } finally {
        process.chdir(previous);
        rmSync(projectDir, { recursive: true, force: true });
      }
    });
  }, "rule-mcp-distill-");
});

test("exportDistill drain:true empties the log after the file exists", () => {
  withHome((ruleHome) => {
    withEnv({ RULE_MCP_NO_TELEMETRY: undefined, RULE_MCP_NO_PROMPTS: "1" }, () => {
      const projectDir = mkdtempSync(join(tmpdir(), "rule-distill-drain-"));
      mkdirSync(join(projectDir, ".git"), { recursive: true });
      const agents = join(ruleHome, "agents");
      writePi(agents, projectDir);

      const previous = process.cwd();
      process.chdir(projectDir);

      try {
        telemetry.startSession({ transport: "stdio", now: 3_000 });
        telemetry.recordToolCall({ tool: "rule_tool", durationMs: 3, ok: true, resultBytes: 10, now: 3_100 });
        telemetry.flush();
        telemetry.endSession({ now: 3_200 });

        const result = exportDistill({ projectDir, home: agents, exportedAt: 4_000, drain: true });

        assert.equal(result.kept, false);
        assert.ok(result.drained >= 1);
        assert.equal(readEvents().length, 0);
      } finally {
        process.chdir(previous);
        rmSync(projectDir, { recursive: true, force: true });
      }
    });
  }, "rule-mcp-distill-d-");
});

test("exportDistill promotes only promotable toolCalls into the tool-cache", () => {
  withHome((ruleHome) => {
    withEnv({ RULE_MCP_NO_TELEMETRY: undefined, RULE_MCP_NO_PROMPTS: "1", RULE_MCP_NO_CACHE: undefined }, () => {
      cacheClear();

      const projectDir = mkdtempSync(join(tmpdir(), "rule-distill-promote-"));
      mkdirSync(join(projectDir, ".git"), { recursive: true });
      const agents = join(ruleHome, "agents");
      writePi(agents, projectDir);

      const previous = process.cwd();
      process.chdir(projectDir);

      try {
        telemetry.startSession({ transport: "stdio", now: 5_000 });
        telemetry.recordToolCall({ tool: "rule_tool", durationMs: 3, ok: true, resultBytes: 10, now: 5_100 });
        telemetry.flush();
        telemetry.endSession({ now: 5_200 });

        const result = exportDistill({
          projectDir,
          home: agents,
          exportedAt: 6_000,
          toolCalls: [
            { tool: "rule_tool", args: { prompt: "from distill" }, result: { content: [{ type: "text", text: "primed" }] } },
            { tool: "rule_tool_git", args: { action: "status" }, result: { content: [{ type: "text", text: "nope" }] } },
          ],
        });

        assert.equal(result.promote.promoted, 1);
        assert.equal(result.promote.skipped.length, 1);
        assert.equal(cacheLookup("rule_tool", { prompt: "from distill" })?.result.content[0].text, "primed");
        assert.equal(cacheLookup("rule_tool_git", { action: "status" }), undefined);
      } finally {
        process.chdir(previous);
        rmSync(projectDir, { recursive: true, force: true });
      }
    });
  }, "rule-mcp-distill-p-");
});
