/**
 * @module test/plans/development-shape
 *
 * ADR 154 amendment (2026-10-31): AI development plans under docs/plans/_*.md
 * carry WSn / WSn-Tx.y and a dual dependency graph. Golden fixture: _asd-ste100.md.
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { scanDevelopmentPlanShape } from "../../src/core/plans/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("docs/plans/_asd-ste100.md satisfies the development-plan shape gate", () => {
  const text = readFileSync(join(root, "docs/plans/_asd-ste100.md"), "utf8");
  const result = scanDevelopmentPlanShape(text);
  assert.equal(result.ok, true, JSON.stringify(result.findings));
});
