import assert from "node:assert/strict";
import { test } from "node:test";

import { DIMENSION_DETAIL, DIMENSIONS, PROFILES, resolveProfile } from "../_profiles.js";

test("every dimension has a sentence that says what it writes", () => {
  for (const dimension of DIMENSIONS) {
    assert.ok(DIMENSION_DETAIL[dimension], `${dimension} needs a detail`);
  }
});

test("minimal keeps the server and the commands", () => {
  assert.deepEqual(resolveProfile("minimal").dimensions, ["server", "commands"]);
});

test("standard and full include every dimension", () => {
  for (const name of ["standard", "full"]) {
    assert.deepEqual(resolveProfile(name).dimensions, DIMENSIONS);
  }
});

test("custom starts empty and an unknown profile throws", () => {
  assert.deepEqual(PROFILES.custom.dimensions, []);
  assert.throws(() => resolveProfile("nope"), /Unknown profile/);
});

test("every profile names the surface it implies", () => {
  assert.equal(PROFILES.minimal.surface, "standard", "the smallest tier left is the hub surface");
  assert.equal(PROFILES.standard.surface, "standard");
  assert.equal(PROFILES.full.surface, "full");
  assert.equal(PROFILES.custom.surface, "full");
});
