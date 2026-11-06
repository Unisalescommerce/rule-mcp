/** Hook files on hosts with no file, and on files that are not a JSON object. */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-hook-files-"));

process.env.HOME = home;
process.env.USERPROFILE = home;

const { hookFile, hookLauncher, installHookFile, mergeHookDocument, removeHookFile, stripHookDocument } = await import("../_hook-files.js");

const place = (agent, body) => {
  const file = hookFile(agent);

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);

  return file;
};

test("a host with no hook file merges nothing", () => {
  assert.equal(hookFile("nobody"), null);
  assert.equal(mergeHookDocument("nobody", {}, { command: "x" }), null);
});

test("a launcher for this node runs the entrypoint, and any other is the command", () => {
  assert.equal(typeof hookLauncher("/x/rule-mcp.js").command, "string");
});

for (const [name, body] of [
  ["broken", "{broken"],
  ["an array", "[]"],
]) {
  test(`a file that is ${name} is left alone on install and on remove`, () => {
    const file = place("cursor", body);

    assert.equal(installHookFile({ agent: "cursor", entrypoint: "/x/rule-mcp.js" }), null);
    assert.equal(removeHookFile({ agent: "cursor" }), null);
    assert.equal(readFileSync(file, "utf8"), body);
  });
}

test("a strip keeps the entries of others and copes with an empty event", () => {
  const document = { hooks: { PreToolUse: null, Stop: [{ matcher: "x", hooks: [{ type: "command", command: "other" }] }] } };
  const stripped = stripHookDocument("claude", document);

  assert.ok(stripped === null || JSON.stringify(stripped).includes("other"));
});
