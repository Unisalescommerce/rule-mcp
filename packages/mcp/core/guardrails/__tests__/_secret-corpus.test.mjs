/** The secret detector needs both positive and negative examples per provider. */
import assert from "node:assert/strict";
import test from "node:test";
import { scores } from "./_scores.fixture.mjs";

test("the secret corpus covers multiple positives and negatives without errors", () => {
  const result = scores.get("secret-detection");

  assert.ok(result.truePositive >= 9);
  assert.ok(result.trueNegative >= 9);
  assert.equal(result.falsePositive, 0);
  assert.equal(result.falseNegative, 0);
});
