/**
 * @module test/plans/development-shape
 *
 * ADR 154 amendment (2026-10-31): AI development plans under docs/plans/_*.md
 * carry WSn / WSn-Tx.y and a dual dependency graph.
 * Golden fixture: scripts/__tests__/fixtures/plans/development-shape-golden.md
 * (live plan `_asd-ste100.md` retired → ADR 204).
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { scanDevelopmentPlanShape } from "../../../packages/mcp/core/plans/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

test("development-shape golden fixture satisfies the shape gate", () => {
  const text = readFileSync(join(root, "scripts/__tests__/fixtures/plans/development-shape-golden.md"), "utf8");
  const result = scanDevelopmentPlanShape(text);
  assert.equal(result.ok, true, JSON.stringify(result.findings));
});
