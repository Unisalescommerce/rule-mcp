/**
 * Guard hooks never call the gateway or apply tools. Bootstrapping them on
 * every `guard` spawn is pure cost (Phase 5 spike). This suite locks the skip.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { shouldBootstrapCoreTools } from "../_program.js";

test("guard does not bootstrap core tools", () => {
  assert.equal(shouldBootstrapCoreTools({ name: () => "guard" }), false);
});

test("other commands still bootstrap core tools", () => {
  assert.equal(shouldBootstrapCoreTools({ name: () => "doctor" }), true);
  assert.equal(shouldBootstrapCoreTools({ name: () => "serve" }), true);
  assert.equal(shouldBootstrapCoreTools(undefined), true);
});
