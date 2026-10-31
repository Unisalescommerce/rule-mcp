/**
@module test/export/promote

Step 7 (EX-09): promote transcript tool results into tool-cache only when
the existing cacheability rules allow it (NON_CACHEABLE + cachePrime).
*/

import { strict as assert } from "node:assert";
import test from "node:test";

import { withEnv, withHome } from "../../../../shared/_testkit.js";

const { promoteToolResults, isPromotableTool } = await import("../index.js");
const { cacheClear, cacheLookup } = await import("../../../cache/tool-cache/index.js");

const okResult = { content: [{ type: "text", text: "ok" }] };

test("isPromotableTool follows NON_CACHEABLE", () => {
  assert.equal(isPromotableTool("rule_tool"), true);
  assert.equal(isPromotableTool("rule_tool_stats"), true);
  assert.equal(isPromotableTool("rule_tool_git"), false);
  assert.equal(isPromotableTool("rule_tool_process_adr"), false);
  assert.equal(isPromotableTool("rule_tool_handoff"), false);
});

test("promoteToolResults primes a cacheable call and leaves NON_CACHEABLE alone", () => {
  withHome(() => {
    withEnv({ RULE_MCP_NO_CACHE: undefined }, () => {
      cacheClear();

      const report = promoteToolResults([
        { tool: "rule_tool", args: { prompt: "export promote" }, result: okResult },
        { tool: "rule_tool_git", args: { action: "status" }, result: okResult },
        { tool: "rule_tool_process_adr", args: { title: "x" }, result: okResult },
      ]);

      assert.equal(report.promoted, 1);
      assert.equal(report.skipped.length, 2);
      assert.ok(report.skipped.every((row) => row.reason === "non-cacheable"));

      const hit = cacheLookup("rule_tool", { prompt: "export promote" });

      assert.ok(hit, "cacheable call was primed");
      assert.equal(hit.result.content[0].text, "ok");

      assert.equal(cacheLookup("rule_tool_git", { action: "status" }), undefined);
    });
  }, "rule-mcp-promote-");
});

test("promoteToolResults skips errors and never overwrites an existing entry", () => {
  withHome(() => {
    withEnv({ RULE_MCP_NO_CACHE: undefined }, () => {
      cacheClear();

      const first = promoteToolResults([
        { tool: "rule_tool_stats", args: {}, result: { content: [{ type: "text", text: "first" }] } },
      ]);

      assert.equal(first.promoted, 1);

      const second = promoteToolResults([
        { tool: "rule_tool_stats", args: {}, result: { content: [{ type: "text", text: "second" }] } },
        { tool: "rule_tool_compress", args: { text: "x" }, result: { isError: true, content: [] } },
      ]);

      assert.equal(second.promoted, 0);
      assert.ok(second.skipped.some((row) => row.reason === "already-stored"));
      assert.ok(second.skipped.some((row) => row.reason === "error-result"));

      const hit = cacheLookup("rule_tool_stats", {});

      assert.equal(hit.result.content[0].text, "first", "cachePrime must not override");
    });
  }, "rule-mcp-promote-idem-");
});

test("promoteToolResults refuses when the cache is disabled", () => {
  withHome(() => {
    withEnv({ RULE_MCP_NO_CACHE: "1" }, () => {
      cacheClear();

      const report = promoteToolResults([
        { tool: "rule_tool", args: { prompt: "nocache" }, result: okResult },
      ]);

      assert.equal(report.promoted, 0);
      assert.ok(report.skipped.every((row) => row.reason === "cache-disabled"));
      assert.equal(cacheLookup("rule_tool", { prompt: "nocache" }), undefined);
    });
  }, "rule-mcp-promote-nc-");
});

test("promoteToolResults normalizes mcp host prefixes to the bare tool name", () => {
  withHome(() => {
    withEnv({ RULE_MCP_NO_CACHE: undefined }, () => {
      cacheClear();

      const report = promoteToolResults([
        {
          tool: "mcp__rule_mcp__rule_tool_search",
          args: { query: "promote" },
          result: okResult,
        },
      ]);

      assert.equal(report.promoted, 1);
      assert.ok(cacheLookup("rule_tool_search", { query: "promote" }));
    });
  }, "rule-mcp-promote-prefix-");
});
