import assert from "node:assert/strict";
import { test } from "node:test";

const { copyToClipboard, toast } = await import("../_clipboard.js");

test("the clipboard and toast are exported without loading the native renderer", () => {
  assert.equal(typeof copyToClipboard, "function");
  assert.equal(typeof toast, "function");
});
