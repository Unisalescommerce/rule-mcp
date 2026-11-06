/** What counts as text a fix must not touch, and what stays code. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { insideLiteral, literalRanges } from "../_literals.js";

test("a line comment ends at the newline, or at the end of the text", () => {
  assert.deepEqual(literalRanges("a // b\nc"), [[2, 6]]);
  assert.deepEqual(literalRanges("// b"), [[0, 4]]);
});

test("a block comment spans lines, closed or not", () => {
  const closed = literalRanges("/* a\nb */ c");

  assert.equal(closed.length, 1);
  assert.equal(closed[0][0], 0);
  assert.equal(literalRanges("/* a").length, 1);
});

test("a string with an escape holds, and an unclosed one stays code", () => {
  assert.equal(literalRanges(String.raw`"a\"b" c`).length, 1);
  assert.deepEqual(literalRanges('"a\nb'), []);
});

test("a template string may span lines", () => {
  assert.equal(literalRanges("`a\nb`").length, 1);
});

test("an offset is inside a range or it is not", () => {
  const ranges = literalRanges('x = "abc"');

  assert.equal(insideLiteral(ranges, 5), true);
  assert.equal(insideLiteral(ranges, 0), false);
});
