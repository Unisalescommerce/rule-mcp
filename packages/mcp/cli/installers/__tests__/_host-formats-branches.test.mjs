/** Each host format, on an entry with a URL, with env, and on text it cannot read. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { removeHostServer, upsertHostServer } from "../_host-formats.js";

const entry = (text) => JSON.parse(text).context_servers["rule-mcp"];

test("a context_servers entry takes a URL with headers, or a command with env", () => {
  assert.deepEqual(entry(upsertHostServer("context_servers", "", { url: "http://x", headers: { a: "b" } })), { url: "http://x", headers: { a: "b" } });
  assert.deepEqual(entry(upsertHostServer("context_servers", "", { url: "http://x" })), { url: "http://x" });
  assert.deepEqual(entry(upsertHostServer("context_servers", "{}", { command: "c" })), { command: "c", args: [] });
  assert.deepEqual(entry(upsertHostServer("context_servers", "", { command: "c", args: ["a"], env: { K: "v" } })), { command: "c", args: ["a"], env: { K: "v" } });
});

test("a context_servers file that does not parse is refused both ways", () => {
  assert.equal(upsertHostServer("context_servers", "{broken", { command: "c" }), null);
  assert.equal(removeHostServer("context_servers", "{broken"), null);
});

test("a remove keeps the other servers and empties a file that held only this one", () => {
  const only = upsertHostServer("context_servers", "", { command: "c" });
  const both = upsertHostServer("context_servers", '{"context_servers":{"other":{}}}', { command: "c" });

  assert.equal(removeHostServer("context_servers", only), "");
  assert.deepEqual(JSON.parse(removeHostServer("context_servers", both)).context_servers, { other: {} });
  assert.equal(removeHostServer("context_servers", '{"theme":"dark"}').includes("theme"), true);
});

test("a TOML table takes a URL or a command with no args", () => {
  assert.match(upsertHostServer("toml_table", "", { url: "http://x" }), /url = "http:\/\/x"/u);
  assert.match(upsertHostServer("toml_table", "", { command: "c" }), /args = \[\]/u);
});

test("a remove reaches the VS Code format", () => {
  const text = upsertHostServer("servers", "", { command: "c" });

  assert.equal(removeHostServer("servers", text).includes("rule-mcp"), false);
});
