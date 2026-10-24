import assert from "node:assert/strict";
import { test } from "node:test";

const { pickDimensions } = await import("../_dimensions.js");

test("the checklist is exported without loading the native renderer", () => {
  assert.equal(typeof pickDimensions, "function");
});
