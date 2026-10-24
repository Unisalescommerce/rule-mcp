import assert from "node:assert/strict";
import { test } from "node:test";

const { runUninstallFlow } = await import("../_uninstall-flow.js");

test("every recorded dimension is preselected and the doctor is not offered", async () => {
  let seen;
  const result = await runUninstallFlow({
    manifest: { dimensions: { server: true, rules: true, doctor: true, commands: false } },
    pickDimensions: async (options) => {
      seen = options;
      return options.selected;
    },
    remove: () => {},
  });

  assert.deepEqual(result, ["server", "rules"]);
  assert.deepEqual(seen.dimensions, ["server", "rules"]);
});

test("cancel removes nothing", async () => {
  let removed = 0;
  const result = await runUninstallFlow({
    manifest: { dimensions: { server: true } },
    pickDimensions: async () => null,
    remove: () => {
      removed += 1;
    },
  });

  assert.equal(result, null);
  assert.equal(removed, 0);
});

test("an empty manifest has nothing to offer", async () => {
  assert.equal(await runUninstallFlow({ manifest: { dimensions: {} }, pickDimensions: async () => assert.fail("must not ask"), remove: () => {} }), null);
});
