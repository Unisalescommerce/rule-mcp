/** Each way git can fail to give a patch, and the reason a person reads. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { diffPatch } from "../_git-patch.js";

const failing = (error) => () => {
  throw error;
};

test("an oversized patch, stderr, a message and nothing each give a reason", () => {
  assert.match(diffPatch(["diff"], { exec: failing({ code: "ENOBUFS" }) }).reason, /larger than 4 MiB/u);
  assert.equal(diffPatch(["diff"], { exec: failing({ stderr: "fatal: bad\nmore" }) }).reason, "fatal: bad");
  assert.equal(diffPatch(["diff"], { exec: failing({ message: "spawn failed" }) }).reason, "spawn failed");
  assert.match(diffPatch(["diff"], { exec: failing({}) }).reason, /git could not produce a patch/u);
});

test("no output is an empty patch", () => {
  assert.deepEqual(diffPatch(["diff"], { exec: () => {} }), { patch: "", reason: "" });
});
