/** Exact local workspace pins must also resolve against the private CI stub. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8"));

test("active workspace dependencies use exact versions", () => {
  for (const path of ["package.json", "packages/mcp/package.json", "packages/shared/package.json", "packages/docs/package.json"]) {
    const manifest = read(path);

    for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
      for (const version of Object.values(manifest[field] ?? {})) {
        assert.match(version, /^(?:workspace:)?\d+\.\d+\.\d+(?:-[\w.-]+)?$/u);
      }
    }
  }
});
