/**
@module test/setup/launcher-live

The doctor row: which target wins, and since when. Three answers, because the
machine has three states and "none" is the one that has to say what repairs it.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { liveLauncher } from "../_launcher-live.js";
import { setCurrent } from "../_launcher-install.js";
import { recordVersion } from "../_launcher-store.js";

const root = mkdtempSync(join(tmpdir(), "rule-live-"));

/** A copy on disk, recorded and pointed at. */
function installCopy(version, installedAt = "2026-10-29") {
  const dir = join(root, "launcher", version, "bin");

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "rule-mcp.js"), "// entry\n");
  recordVersion({ root, row: { version, source: "/tmp/checkout", installedAt } });
  setCurrent({ root, version });
}

test("the copy wins, and the row says since when", () => {
  installCopy("1.0.0");
  const live = liveLauncher({ root, checkout: join(root, "checkout.js") });

  assert.equal(live.kind, "copy");
  assert.equal(live.version, "1.0.0");
  assert.match(live.label, /copy 1\.0\.0 \(installed 2026-10-29\)/u);
});

test("a pointer to nothing falls to the checkout", () => {
  setCurrent({ root, version: "9.9.9" });
  const checkout = join(root, "checkout.js");

  writeFileSync(checkout, "// entry\n");

  const live = liveLauncher({ root, checkout });

  assert.equal(live.kind, "checkout");
  assert.equal(live.path, checkout);
});

test("neither answers, and the row names the repair", () => {
  const live = liveLauncher({ root: join(root, "empty"), checkout: join(root, "gone.js") });

  assert.equal(live.kind, "none");
  assert.match(live.label, /rule-mcp setup/u);
});
