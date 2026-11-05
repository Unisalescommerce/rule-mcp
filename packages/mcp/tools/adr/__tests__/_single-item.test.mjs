import assert from "node:assert/strict";
import test from "node:test";
import { ADRSchema } from "../_schema.js";

test("ADR input accepts one alternative and one tag", () => {
  const result = ADRSchema.safeParse({ title: "Example", alternatives: "Do nothing", tags: "security" });

  assert.equal(result.success, true);
});

test("ADR input keeps array support and rejects malformed items", () => {
  assert.equal(ADRSchema.safeParse({ title: "Example", alternatives: ["One", "Two"], tags: ["security"] }).success, true);
  assert.equal(ADRSchema.safeParse({ title: "Example", alternatives: [42] }).success, false);
  assert.equal(ADRSchema.safeParse({ title: "Example", tags: {} }).success, false);
});
