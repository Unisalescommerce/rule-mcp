import assert from "node:assert/strict";
import test from "node:test";
import { ARGUMENTS, answerOf, cacheClear, callTool, validateApply } from "./_receipt.fixture.mjs";
import { listTools } from "../../router/index.js";

test("a single file object receives a path-bound receipt", async () => {
  cacheClear();
  const file = ARGUMENTS.files[0];
  const result = await callTool("rule_tool_gateway", { ...ARGUMENTS, files: file });
  const answer = answerOf(result);

  assert.ok(answer.receipt);
  assert.equal(validateApply(answer.receipt, [file]).valid, true);
  assert.equal(validateApply(answer.receipt, [{ ...file, path: "elsewhere.js" }]).valid, false);
});

test("the advertised schema accepts a file object as well as an array", () => {
  const tool = listTools().find((entry) => entry.name === "rule_tool_gateway");
  const alternatives = tool.inputSchema.properties.files.anyOf;

  assert.deepEqual(new Set(alternatives.map((schema) => schema.type)), new Set(["object", "array"]));
});

test("a malformed single file is rejected", async () => {
  const result = await callTool("rule_tool_gateway", { ...ARGUMENTS, files: { path: "file.js" } });

  assert.equal(result.isError, true);
});
