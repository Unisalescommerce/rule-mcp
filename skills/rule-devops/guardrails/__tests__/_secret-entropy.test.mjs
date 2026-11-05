import assert from "node:assert/strict";
import test from "node:test";

import { shannonEntropy } from "../_secret-entropy.js";

test("empty and repeated bytes have zero entropy", () => {
  assert.equal(shannonEntropy(""), 0);
  assert.equal(shannonEntropy("aaaa"), 0);
});

test("balanced and unbalanced byte distributions have expected entropy", () => {
  assert.equal(shannonEntropy("aabb"), 1);
  assert.equal(shannonEntropy("abcd"), 2);
  assert.ok(Math.abs(shannonEntropy("aaab") - 0.8112781244591328) < 1e-12);
});

test("entropy is computed over UTF-8 bytes as in Betterleaks", () => {
  assert.equal(shannonEntropy("é"), 1);
  assert.equal(shannonEntropy("éé"), 1);
});
