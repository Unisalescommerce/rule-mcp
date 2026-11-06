/**
 * The entry `pnpm install -g .` leaves in the global store, and the uninstall
 * that must take it with it.
 *
 * The shim file is the visible half. The store entry is the half that made the
 * next install die: `ERR_PNPM_GLOBAL_BIN_CONFLICT`, because the bin `rule-mcp`
 * was still claimed by a package the uninstall had reported as removed.
 */
import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { isRemoved, run, sandbox } from "./_shim-apply-child.fixture.mjs";

test("a removal takes the pnpm global link entry with it", () => {
  const box = sandbox();
  // What `pnpm install -g .` leaves behind: a project directory named by a hash,
  // holding a symlink named after the dependency. A directory stands in for the
  // link here: what the sweep must find is the entry, not the target.
  const link = join(box.home, ".pnpm", "global", "v11", "56af-18e56ecb617b80d8-0", "node_modules", "rule-mcp-workspace");

  mkdirSync(link, { recursive: true });

  try {
    const removed = run("removeGlobalShims()", box);

    assert.deepEqual(
      removed.map((entry) => entry.path),
      [link],
      JSON.stringify(removed),
    );
    assert.ok(removed.every(isRemoved), JSON.stringify(removed));
    assert.equal(existsSync(link), false, "the global link entry is gone, not only the shim");
    assert.deepEqual(run("removeGlobalShims()", box), [], "a second removal finds nothing left");
  } finally {
    rmSync(box.home, { recursive: true, force: true });
  }
});

test("the scan sees a link even when the shim is already gone", () => {
  const box = sandbox();
  const link = join(box.home, ".pnpm", "global", "v11", "9c58-18db952361d879b8-0", "node_modules", "rule-mcp");

  mkdirSync(link, { recursive: true });

  try {
    // The uninstall offers a group only when the scan finds something to remove:
    // a link nobody reports is a group the user cannot select.
    assert.equal(run("globalShimPresent()", box), true, "the global link counts as something installed");
  } finally {
    rmSync(box.home, { recursive: true, force: true });
  }
});
