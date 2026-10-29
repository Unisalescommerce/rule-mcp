/**
@module test/prompts/client-suppression

Prompt suppression is per client, and the client is the one the handshake named
unless the environment overrides it. The rules: a bare `1` suppresses for every
client, a list suppresses only for the names it holds, and an unknown client is
never suppressed by a list.
*/

import test from "node:test";
import assert from "node:assert/strict";

import { clientIdentity, parseSuppression, suppressesPrompts } from "../_client-suppression.js";
import { listActivePrompts } from "../_registry.js";

test("a bare 1 suppresses for every client", () => {
  for (const value of ["1", "true", "yes", "all", "*"]) {
    assert.equal(suppressesPrompts({ env: { RULE_MCP_NO_MCP_PROMPTS: value }, clientName: "anything" }), true, value);
  }

  assert.equal(suppressesPrompts({ env: { RULE_MCP_NO_MCP_PROMPTS: "1" } }), true, "a client that did not identify itself is still covered");
});

test("an empty or absent value suppresses nothing", () => {
  for (const value of [undefined, "", "  ", ",", "0", "false"]) {
    assert.equal(suppressesPrompts({ env: { RULE_MCP_NO_MCP_PROMPTS: value }, clientName: "claude-code" }), false, String(value));
  }
});

test("a list suppresses only the names it holds, case-insensitively", () => {
  const env = { RULE_MCP_NO_MCP_PROMPTS: "claude-code, Cursor-VSCode" };

  assert.equal(suppressesPrompts({ env, clientName: "claude-code" }), true);
  assert.equal(suppressesPrompts({ env, clientName: "Cursor-VSCode" }), true);
  assert.equal(suppressesPrompts({ env, clientName: "zed" }), false, "a client outside the list keeps its prompts");
  assert.equal(suppressesPrompts({ env }), false, "and a list never covers a client that did not identify itself");
});

test("a version suffix and a longer client name still match", () => {
  const env = { RULE_MCP_NO_MCP_PROMPTS: "claude-code" };

  assert.equal(suppressesPrompts({ env, clientName: "claude-code/2.1.0" }), true, "the handshake carries name and version as one string");
  assert.equal(suppressesPrompts({ env, clientName: "claude-codex" }), false, "a prefix that is not a word boundary is another client");
});

test("the environment names the client before the handshake does", () => {
  assert.deepEqual(clientIdentity({ env: { RULE_MCP_CLIENT: "cursor" }, clientVersion: { name: "claude-code", version: "1.0" } }), {
    name: "cursor",
    source: "env",
  });
  assert.deepEqual(clientIdentity({ env: {}, clientVersion: { name: "claude-code", version: "1.0" } }), { name: "claude-code", source: "handshake" });
  assert.deepEqual(clientIdentity({ env: {}, clientVersion: undefined }), { name: undefined, source: "unknown" });
});

test("identity from the environment makes a shared entry suppress acceptance for its own client only", () => {
  const env = { RULE_MCP_NO_MCP_PROMPTS: "claude-code", RULE_MCP_CLIENT: "claude-code" };

  assert.equal(suppressesPrompts({ env, clientName: clientIdentity({ env }).name }), true);
});

test("parsing reports what it understood", () => {
  assert.deepEqual(parseSuppression("1"), { all: true, names: [] });
  assert.deepEqual(parseSuppression("claude-code, , Zed"), { all: false, names: ["claude-code", "zed"] });
  assert.deepEqual(parseSuppression(undefined), { all: false, names: [] });
});

test("the registry hides its prompts for a named client", () => {
  const previous = process.env.RULE_MCP_NO_MCP_PROMPTS;

  try {
    process.env.RULE_MCP_NO_MCP_PROMPTS = "claude-code";

    assert.equal(listActivePrompts("claude-code").length, 0, "the listed client sees nothing");
    assert.ok(listActivePrompts("zed").length > 0, "another client keeps the registry");
  } finally {
    if (previous === undefined) {
      delete process.env.RULE_MCP_NO_MCP_PROMPTS;
    } else {
      process.env.RULE_MCP_NO_MCP_PROMPTS = previous;
    }
  }
});
