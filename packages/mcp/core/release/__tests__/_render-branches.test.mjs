/** The lines `rule-mcp init` adds after its own report. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { renderInitExtras } from "../_render.js";

test("nothing to report renders nothing", () => {
  assert.deepEqual(renderInitExtras({}), []);
});

test("a project with no release tooling says so", () => {
  assert.match(renderInitExtras({ release: {} }).join("\n"), /no changelog\/version tooling detected/u);
});

test("exact pins and loose pins read differently", () => {
  assert.match(renderInitExtras({ dependencies: {} }).join("\n"), /every specifier is an exact x\.y\.z pin/u);

  const loose = renderInitExtras({ dependencies: { unpinned: [{ field: "dependencies", name: "x", specifier: "^1.0.0" }] } }).join("\n");

  assert.match(loose, /dependencies: x = \^1\.0\.0/u);
});
