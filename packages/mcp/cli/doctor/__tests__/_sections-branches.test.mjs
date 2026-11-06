/** The System section with an old Node, each launcher kind, and a gate skip. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { systemSection } from "../_sections.js";

const report = (over = {}) => ({ ok: true, version: "0.1.0", sdk: "1", node: "v26.4.0", platform: "darwin", arch: "arm64", entrypoint: "/x", ...over });
const text = (over) => systemSection(report(over)).join("\n");

test("a Node below the floor is flagged, and a good one is not", () => {
  assert.notEqual(text({ nodeOk: false }), text({ nodeOk: true }));
});

test("the launcher line appears only with a launcher", () => {
  assert.doesNotMatch(text(), /Launcher:/u);
  assert.match(text({ launcher: { kind: "copy", label: "copy 0.1.0" } }), /copy 0\.1\.0/u);
  assert.match(text({ launcher: { kind: "none", label: "none" } }), /Launcher: {4}.*none/u);
});

test("a gate skip shows unless a newer copy replaced it", () => {
  const launcher = { kind: "copy", label: "copy", installedAt: "2026-11-06" };

  assert.match(text({ launcherSkip: { reason: "no pnpm" } }), /Gate skip:.*unknown no pnpm/u);
  assert.match(text({ launcher, launcherSkip: { at: "2026-11-07T10:00:00Z", reason: "late" } }), /2026-11-07T10:00:00Z late/u);
  assert.doesNotMatch(text({ launcher, launcherSkip: { at: "2026-11-01T10:00:00Z", reason: "old" } }), /Gate skip/u);
});
