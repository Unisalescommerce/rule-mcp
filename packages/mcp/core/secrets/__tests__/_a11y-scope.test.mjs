/** Non-UI Node tests must not require browser accessibility infrastructure. */
import assert from "node:assert/strict";
import test from "node:test";
import { a11yTestRequired } from "../../../../../skills/rule-styleguide-a11y/guardrails/_a11y-test-required.js";

const context = { fileName: "probe.test.mjs", helpers: { maskLiterals: (code) => code } };

test("Node tests without UI do not require axe", () => {
  assert.equal(a11yTestRequired.check('import test from "node:test"; test("probe", () => {});', context).pass, true);
});

test("Node tests marked as components still require accessibility coverage", () => {
  assert.equal(a11yTestRequired.check('import test from "node:test";', { ...context, isComponent: true }).pass, false);
});

test("Playwright tests still require axe", () => {
  assert.equal(a11yTestRequired.check('import { test } from "@playwright/test";', context).pass, false);
});
