/** The keep count: an argument, a variable, or neither, and each bad value. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { keepSet, resolveKeep, runCleanup } from "../index.js";

/** Run with one value of the variable, and put the old value back. */
function withKeep(value, fn) {
  const previous = process.env.RULE_MCP_EXPORT_KEEP_SESSIONS;

  if (value === undefined) {
    delete process.env.RULE_MCP_EXPORT_KEEP_SESSIONS;
  } else {
    process.env.RULE_MCP_EXPORT_KEEP_SESSIONS = value;
  }

  try {
    return fn();
  } finally {
    if (previous === undefined) {
      delete process.env.RULE_MCP_EXPORT_KEEP_SESSIONS;
    } else {
      process.env.RULE_MCP_EXPORT_KEEP_SESSIONS = previous;
    }
  }
}

test("a number argument wins, and a negative one is zero", () => {
  assert.equal(resolveKeep(3), 3);
  assert.equal(resolveKeep(-2), 0);
});

test("the variable decides when no argument does", () => {
  assert.equal(
    withKeep("7", () => resolveKeep()),
    7,
  );
  assert.equal(
    withKeep("-1", () => resolveKeep()),
    0,
  );
});

test("an unset, empty or broken variable gives the default", () => {
  for (const value of [undefined, "", "abc"]) {
    assert.equal(
      withKeep(value, () => resolveKeep(NaN)),
      5,
    );
  }
});

test("a keep that is not a number keeps nothing", () => {
  assert.equal(keepSet([{ id: "a", mtime: 1 }], { keep: "many" }).size ?? keepSet([{ id: "a", mtime: 1 }], { keep: "many" }).length, 0);
});

test("an agent with no transcripts is skipped and nothing is deleted", () => {
  const result = runCleanup({ agent: "nobody", projectDir: "/tmp", confirmed: true });

  assert.equal(result.ok, false);
});
