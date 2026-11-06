/** The version probe on each failure, and on output it cannot read. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { readVersion } from "../_probe.js";

const failing = (error) => () => {
  throw error;
};

test("a kill and a timeout read as no answer", () => {
  assert.match(readVersion({ exec: failing({ signal: "SIGKILL" }) }).reason, /did not answer/u);
  assert.match(readVersion({ exec: failing({ code: "ETIMEDOUT" }) }).reason, /did not answer/u);
});

test("an error with a message or with nothing still gives a reason", () => {
  assert.match(readVersion({ exec: failing({ message: "spawn failed" }) }).reason, /spawn failed/u);
  assert.match(readVersion({ exec: failing({}) }).reason, /betterleaks could not be run/u);
});

test("empty output has no version and is trusted", () => {
  const result = readVersion({ exec: () => {} });

  assert.equal(result.version, null);
  assert.equal(result.available, true);
});
