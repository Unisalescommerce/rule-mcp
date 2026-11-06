/** An in-page link needs a heading with its id. */
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildSite } from "../build.mjs";

const root = join(import.meta.dirname, "..", "..", "..");

test("every in-page link lands on a heading", () => {
  const outDir = mkdtempSync(join(tmpdir(), "rule-mcp-site-anchors-"));
  const pages = buildSite({ projectDir: root, outDir });
  const dead = [];

  for (const page of pages) {
    const html = readFileSync(join(outDir, page.out), "utf8");
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/gu)].map((match) => match[1]));

    for (const [, target] of html.matchAll(/href="#([^"]+)"/gu)) {
      if (!ids.has(target)) {
        dead.push(`${page.out}#${target}`);
      }
    }
  }

  assert.deepEqual(dead, []);
});
