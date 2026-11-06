/**
 * A pending ADR is a real document at a real path, so a handoff that cites it
 * must be verified against that path rather than reported as "not written".
 * Pending records live in `docs/adr/_pending/` and carry no number, which is
 * why a numbered lookup never found them.
 */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { parseHandoff } from "../_parse.js";
import { verifyAdr } from "../_verify-refs.js";

const pending = (slug, status) => `# Pending: ${slug}\n\n- **Status**: ${status}\n`;

test("a pending ADR span is a claim about a document, not about a number", () => {
  const claims = parseHandoff("# Session handoff\n\n**Branch**: `rel/v0.1.0`\n\nSee `docs/adr/_pending/use-offline-scans.md` for the open decision.\n");

  assert.deepEqual(claims.adrs, ["use-offline-scans"]);
});

test("a pending ADR is verified from its own file", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-handon-pending-"));

  try {
    mkdirSync(join(root, "docs", "adr", "_pending"), { recursive: true });
    writeFileSync(join(root, "docs", "adr", "_pending", "use-offline-scans.md"), pending("use offline scans", "accepted"));

    assert.equal(verifyAdr(root, "use-offline-scans"), "accepted");
    assert.equal(verifyAdr(root, "missing-decision"), "not written");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a numbered ADR is still resolved from its number", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-handon-numbered-"));

  try {
    mkdirSync(join(root, "docs", "adr"), { recursive: true });
    writeFileSync(join(root, "docs", "adr", "212-close-out-plan.md"), "# 212: Close out plan\n\n- **Status**: accepted\n");

    assert.equal(verifyAdr(root, "212"), "accepted");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a landed ADR is found by the slug it had while pending", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-handon-landed-"));

  try {
    mkdirSync(join(root, "docs", "adr"), { recursive: true });
    writeFileSync(join(root, "docs", "adr", "213-my-landed-slug.md"), "# 213: Landed\n\n- **Status**: accepted\n");

    assert.equal(verifyAdr(root, "my-landed-slug"), "accepted");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
