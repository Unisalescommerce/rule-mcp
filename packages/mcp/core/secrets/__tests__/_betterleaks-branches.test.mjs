/** Each way the scanner can fail to run, and the reason a person reads. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { scanPatch } from "../_betterleaks.js";

const failing = (error) => () => {
  throw error;
};

test("no patch is a clean scan", () => {
  assert.deepEqual(scanPatch(), { scanned: true, findings: [], reason: "" });
});

test("a kill, a timeout and stderr each give their own reason", () => {
  assert.match(scanPatch("+x", { exec: failing({ signal: "SIGKILL" }) }).reason, /did not answer/u);
  assert.match(scanPatch("+x", { exec: failing({ code: "ETIMEDOUT" }) }).reason, /did not answer/u);
  assert.equal(scanPatch("+x", { exec: failing({ stderr: "boom\nmore" }) }).reason, "boom");
});

test("an error with no detail still gives a reason", () => {
  assert.match(scanPatch("+x", { exec: failing({ message: "spawn failed" }) }).reason, /spawn failed/u);
  assert.match(scanPatch("+x", { exec: failing({}) }).reason, /betterleaks could not r/u);
  assert.match(scanPatch("+x", { exec: failing({ status: 3 }) }).reason, /3/u);
});

test("a report that does not parse is a scan that did not run", () => {
  const result = scanPatch("+x", { exec: () => "not json" });

  assert.equal(result.scanned, false);
  assert.ok(result.reason.length > 0);
});
