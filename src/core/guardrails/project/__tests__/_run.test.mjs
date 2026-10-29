/**
 * Project-level guardrails: the graph checks pass, fail or skip, and a
 * missing graph is never a failure.
 */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { checkProjectGuarded } from "../_run.js";
import { cyclicSource } from "./_cycle.fixture.mjs";

/**
 * A project root the dead-code check can read: it decides from the source, so a
 * path that does not exist would make every dead-symbol answer inconclusive.
 */
const project = mkdtempSync(join(tmpdir(), "rule-project-run-"));

mkdirSync(join(project, "src"), { recursive: true });
writeFileSync(join(project, "src", "dead.js"), ["function orphan() {", "  return 1;", "}", ""].join("\n"));
writeFileSync(join(project, "src", "a.js"), cyclicSource("a", "b"));
writeFileSync(join(project, "src", "b.js"), cyclicSource("b", "a"));

test.after(() => rmSync(project, { recursive: true, force: true }));

/** A client that answers every tool with a clean graph. */
const cleanClient = (tool) => {
  if (tool === "circular") {
    return { ok: true, value: { cycle_count: 0, cycles: [] } };
  }

  if (tool === "health") {
    return { ok: true, value: { quality_signal: 9000 } };
  }

  if (tool === "dead_code") {
    return { ok: true, value: { dead_code_count: 0, symbols: [] } };
  }

  if (tool === "diagnostics") {
    return { ok: true, value: { diagnostics: [] } };
  }

  return { ok: true, value: { match_count: 0, matches: [] } };
};

test("a clean graph passes every project check", () => {
  const result = checkProjectGuarded(project, { probe: () => ({ available: true }), client: cleanClient, diagnostics: true });

  assert.equal(result.allPass, true);
  assert.equal(result.failCount, 0);
  assert.equal(result.skippedCount, 0);
});

test("the optional diagnostics check is skipped unless asked", () => {
  const result = checkProjectGuarded(project, { probe: () => ({ available: true }), client: cleanClient });

  assert.equal(result.allPass, true);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.skipped[0].id, "project-diagnostics");
});

test("a cycle, a low health score, dead code and an unsafe pattern each fail", () => {
  const client = (tool) => {
    if (tool === "circular") {
      return { ok: true, value: { cycle_count: 2, cycles: [["src/a.js", "src/b.js"]] } };
    }

    if (tool === "health") {
      return { ok: true, value: { quality_signal: 5000 } };
    }

    if (tool === "dead_code") {
      // The graph names the symbol; the check decides whether it is dead, so a
      // count alone is no longer a failure.
      return { ok: true, value: { dead_code_count: 1, symbols: [{ file: "src/dead.js", name: "orphan" }] } };
    }

    return { ok: true, value: { match_count: 1, matches: [], by_kind: { expect: 1 } } };
  };
  const result = checkProjectGuarded(project, { probe: () => ({ available: true }), client });
  const ids = result.failed.map((entry) => entry.id);

  assert.equal(result.allPass, false);
  assert.deepEqual(ids, ["project-circular", "project-health", "project-dead-code", "project-unsafe-patterns"]);
});

test("a missing graph skips every check instead of failing", () => {
  const result = checkProjectGuarded(project, { probe: () => ({ available: false }) });

  assert.equal(result.allPass, true);
  assert.equal(result.failCount, 0);
  assert.equal(result.skippedCount, result.total);
});

test("a failing tool call skips its check", () => {
  const client = () => ({ ok: false, unavailable: true, error: "boom" });
  const result = checkProjectGuarded(project, { probe: () => ({ available: true }), client });

  assert.equal(result.allPass, true);
  assert.equal(result.skippedCount, result.total);
  assert.equal(result.skipped[0].reason, "boom");
});
