import assert from "node:assert/strict";
import { test } from "node:test";

const { pickProfile } = await import("../_render.js");

test("the picker is exported without loading the native renderer", () => {
  assert.equal(typeof pickProfile, "function");
});
