/** merge-index regenerates ADR.md instead of three-way merging it. */
import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { mergeGeneratedIndex } from "../_merge-index.js";

test("mergeGeneratedIndex rewrites ADR.md from the files on disk", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-merge-index-"));
  const adr = join(root, "docs", "adr");
  const ours = join(adr, "ADR.md");

  try {
    mkdirSync(adr, { recursive: true });
    writeFileSync(
      join(adr, "001-one.md"),
      "# 001: One\n\n- **Date**: 2026-01-01\n- **Status**: accepted\n- **Tags**: test\n\n## Decision\n\nShip it.\n",
    );
    writeFileSync(ours, "# stale conflict marker\n<<<<<<<\n=======\n>>>>>>>\n");

    const result = mergeGeneratedIndex("/tmp/O", ours, "/tmp/B", "docs/adr/ADR.md", { projectDir: root });

    assert.equal(result.regenerated, true);
    assert.equal(result.kind, "adr");
    const body = readFileSync(ours, "utf8");
    assert.match(body, /001/);
    assert.doesNotMatch(body, /<<<<<<</);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
