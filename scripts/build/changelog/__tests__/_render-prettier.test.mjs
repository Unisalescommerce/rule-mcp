/**
 * The changelog is checked twice: against a fresh generation, and by Prettier.
 * A subject that Prettier rewrites fails one check or the other forever, and
 * the pre-push gate stops the release at its last step.
 */
import { strict as assert } from "node:assert";
import test from "node:test";

import prettier from "prettier";

import { renderRelease } from "../_render.mjs";

const entry = (subject) => ({ section: "Changed", scope: "test", subject, text: subject, sha: "abc1234", hash: "abc1234" });

test("a dunder word survives Prettier as it was written", async () => {
  const text = renderRelease("[1.0.0]", [entry("co-locate suites as src __tests__ folders")]);

  assert.equal((await prettier.format(text, { parser: "markdown" })).trim(), text.trim());
  assert.match(text, /`__tests__`/u);
});

test("a word in a code span stays as it is", () => {
  const text = renderRelease("[1.0.0]", [entry("move `__tests__` out")]);

  assert.match(text, /move `__tests__` out/u);
  assert.doesNotMatch(text, /``/u);
});
