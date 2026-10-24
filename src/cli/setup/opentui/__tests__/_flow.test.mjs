import assert from "node:assert/strict";
import { test } from "node:test";

const { runInstallerFlow } = await import("../_flow.js");

test("a standard profile takes its dimensions from the profile table", async () => {
  const recorded = [];
  const result = await runInstallerFlow({
    pickProfile: async () => "standard",
    pickDimensions: async () => assert.fail("must not ask"),
    record: (value) => recorded.push(value),
  });

  assert.deepEqual(result, { profile: "standard", dimensions: ["server", "rules", "commands", "hooks", "doctor"] });
  assert.deepEqual(recorded, [result]);
});

test("custom asks for the dimensions", async () => {
  const result = await runInstallerFlow({
    pickProfile: async () => "custom",
    pickDimensions: async () => ["server", "commands"],
    record: () => {},
  });

  assert.deepEqual(result, { profile: "custom", dimensions: ["server", "commands"] });
});

test("cancel at either step returns null and records nothing", async () => {
  let recorded = 0;
  assert.equal(
    await runInstallerFlow({
      pickProfile: async () => null,
      pickDimensions: async () => [],
      record: () => {
        recorded += 1;
      },
    }),
    null,
  );
  assert.equal(
    await runInstallerFlow({
      pickProfile: async () => "custom",
      pickDimensions: async () => null,
      record: () => {
        recorded += 1;
      },
    }),
    null,
  );
  assert.equal(recorded, 0);
});
