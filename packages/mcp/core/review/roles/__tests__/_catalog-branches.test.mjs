/** A persona directory that cannot be read reports it and loads no roles. */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { loadPersonaCatalog } from "../_catalog.js";

test("a missing directory is a problem, not a crash", () => {
  const { roles, problems } = loadPersonaCatalog(pathToFileURL(join(tmpdir(), "rule-mcp-no-such-roles/")));

  assert.deepEqual(roles, []);
  assert.match(problems[0].reason, /does not exist/u);
});

test("a directory named like a persona file is reported as unreadable", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-roles-"));

  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "broken.md"));

  const { problems } = loadPersonaCatalog(pathToFileURL(`${dir}/`));

  assert.match(problems[0].reason, /unreadable/u);
});
