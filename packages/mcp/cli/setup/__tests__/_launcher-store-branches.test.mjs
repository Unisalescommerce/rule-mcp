/** The launcher records when a file is missing, empty, or not what it should be. */
import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { currentVersion, installedVersions, launcherRoot, setCurrent } from "../_launcher-store.js";

/** A runtime home with a launcher directory. */
function home(t) {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-launcher-store-"));

  mkdirSync(launcherRoot({ root }), { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));

  return root;
}

test("no pointer and an empty pointer both mean no version", (t) => {
  const root = home(t);

  assert.equal(currentVersion({ root }), undefined);
  writeFileSync(join(launcherRoot({ root }), "current"), "\n");
  assert.equal(currentVersion({ root }), undefined);
});

test("a dry run names the pointer and writes nothing", (t) => {
  const root = home(t);
  const file = setCurrent({ root, version: "0.1.0", dryRun: true });

  assert.equal(existsSync(file), false);
});

test("a record that is not a list reads as no versions", (t) => {
  const root = home(t);

  assert.deepEqual(installedVersions({ root }), []);

  for (const body of ["{}", "{broken"]) {
    writeFileSync(join(launcherRoot({ root }), "installed.json"), body);
    assert.deepEqual(installedVersions({ root }), []);
  }
});
