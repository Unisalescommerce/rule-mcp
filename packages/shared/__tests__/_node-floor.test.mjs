/**
 * The two floors: what the server runs on, and what the renderer needs.
 *
 * They are separate because the server never loads the renderer. A Node 24 host
 * runs every tool and prints the same plan from the flags.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { NODE_FLOOR, WIZARD_FLOOR, nodeAtLeast } from "../_node-floor.js";

test("the server floor is Node 24 and the wizard floor stays 26.4", () => {
  assert.equal(NODE_FLOOR, "24.0.0");
  assert.equal(WIZARD_FLOOR, "26.4.0");
});

test("the wizard floor refuses 24 and accepts 26.4", () => {
  assert.equal(nodeAtLeast("v24.22.1", WIZARD_FLOOR), false, "24 runs the server, not the wizard");
  assert.equal(nodeAtLeast("v26.3.9", WIZARD_FLOOR), false, "the minor matters");
  assert.equal(nodeAtLeast("v26.4.0", WIZARD_FLOOR), true);
});

test("the server floor accepts 24 and refuses 23", () => {
  assert.equal(nodeAtLeast("v24.0.0"), true);
  assert.equal(nodeAtLeast("v24.22.1"), true);
  assert.equal(nodeAtLeast("v26.12.1"), true);
  assert.equal(nodeAtLeast("v23.11.1"), false);
});
