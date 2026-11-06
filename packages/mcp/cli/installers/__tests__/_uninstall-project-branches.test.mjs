/** A project uninstall on a host with no file, and on a file it cannot read. */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { uninstallProjectHost } from "../_uninstall-project.js";

test("a host with no project config is refused", () => {
  assert.throws(() => uninstallProjectHost({ agent: "nobody", projectRoot: "/tmp" }), /has no project config/u);
});

test("a config that does not parse is left alone and reported", (t) => {
  const projectRoot = mkdtempSync(join(tmpdir(), "rule-mcp-uninstall-project-"));
  const file = join(projectRoot, ".mcp.json");

  t.after(() => rmSync(projectRoot, { recursive: true, force: true }));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, "{broken");

  assert.throws(() => uninstallProjectHost({ agent: "claude", projectRoot }), /Refused to overwrite unreadable project config/u);
  assert.equal(readFileSync(file, "utf8"), "{broken");
});
