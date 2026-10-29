/** The prompts handlers list the registry and reject bad gets, against a stub server. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { registerPromptHandlers } from "../_prompt-handlers.js";

/** A server stub that records its handlers, in registration order, and its client. */
function stubServer(client) {
  const handlers = [];

  return {
    handlers,
    getClientVersion: () => client,
    setRequestHandler(_schema, handler) {
      handlers.push(handler);
    },
  };
}

test("prompts/list serves the registry with compressed descriptions", async () => {
  const server = stubServer();

  registerPromptHandlers(server);
  assert.equal(server.handlers.length, 2, "list and get are both registered");

  const { prompts } = await server.handlers[0]();

  assert.ok(prompts.length > 0, "the registry is served");
  assert.ok(
    prompts.every((prompt) => typeof prompt.name === "string" && typeof prompt.description === "string" && Array.isArray(prompt.arguments)),
    "every entry carries its name, description and arguments",
  );
});

test("prompts/list honors RULE_MCP_NO_PROMPTS suppression", async () => {
  const server = stubServer();

  registerPromptHandlers(server);
  const previous = process.env.RULE_MCP_NO_PROMPTS;

  process.env.RULE_MCP_NO_PROMPTS = "1";

  try {
    const { prompts } = await server.handlers[0]();

    assert.equal(prompts.length, 0, "suppressed prompts/list must return no prompts, so Claude Code shows only the local /rule-mcp-* commands");
  } finally {
    if (previous === undefined) {
      delete process.env.RULE_MCP_NO_PROMPTS;
    } else {
      process.env.RULE_MCP_NO_PROMPTS = previous;
    }
  }
});

test("prompts/get rejects a missing or unknown name", async () => {
  const server = stubServer();

  registerPromptHandlers(server);
  const get = server.handlers[1];

  await assert.rejects(get({ params: {} }), /Prompt name is required/, "a nameless get is rejected");
  await assert.rejects(get({ params: { name: "no-such-prompt", arguments: {} } }), /Unknown prompt/, "an unknown name is rejected");
});

test("prompts/list hides the prompts for the client the handshake named", async () => {
  const server = stubServer({ name: "claude-code", version: "2.1.0" });

  registerPromptHandlers(server);
  const previous = process.env.RULE_MCP_NO_MCP_PROMPTS;
  const previousClient = process.env.RULE_MCP_CLIENT;

  process.env.RULE_MCP_NO_MCP_PROMPTS = "claude-code";
  delete process.env.RULE_MCP_CLIENT;

  try {
    const { prompts } = await server.handlers[0]();

    assert.equal(prompts.length, 0, "the named client gets an empty list from one shared entry");
  } finally {
    if (previous === undefined) {
      delete process.env.RULE_MCP_NO_MCP_PROMPTS;
    } else {
      process.env.RULE_MCP_NO_MCP_PROMPTS = previous;
    }

    if (previousClient !== undefined) {
      process.env.RULE_MCP_CLIENT = previousClient;
    }
  }
});

test("prompts/list keeps the prompts for a client the policy does not name", async () => {
  const server = stubServer({ name: "zed", version: "1.0" });

  registerPromptHandlers(server);
  const previous = process.env.RULE_MCP_NO_MCP_PROMPTS;
  const previousClient = process.env.RULE_MCP_CLIENT;

  process.env.RULE_MCP_NO_MCP_PROMPTS = "claude-code";
  delete process.env.RULE_MCP_CLIENT;

  try {
    const { prompts } = await server.handlers[0]();

    assert.ok(prompts.length > 0);
  } finally {
    if (previous === undefined) {
      delete process.env.RULE_MCP_NO_MCP_PROMPTS;
    } else {
      process.env.RULE_MCP_NO_MCP_PROMPTS = previous;
    }

    if (previousClient !== undefined) {
      process.env.RULE_MCP_CLIENT = previousClient;
    }
  }
});
