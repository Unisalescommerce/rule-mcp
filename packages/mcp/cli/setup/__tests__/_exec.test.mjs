/**
 * The log a setup step captures from a child CLI.
 *
 * The child is forced to plain text, so the capture holds rows a person reads.
 * A runner that exports FORCE_COLOR must not put its own warning in that log.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { runCliCommand } from "../_exec.js";

/** Run fn with the given env values, restoring every key afterwards. */
async function withEnv(overrides, fn) {
  const saved = {};

  for (const [key, value] of Object.entries(overrides)) {
    saved[key] = process.env[key];

    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("a forced color in the runner adds no warning to the captured log", async () => {
  const result = await withEnv({ FORCE_COLOR: "1", NO_COLOR: undefined }, () => runCliCommand(["--not-a-flag"]));

  assert.equal(result.ok, false, "the child exits non-zero");
  assert.ok(
    result.lines.some((line) => /--not-a-flag|unknown option/i.test(line)),
    `the complaint is kept: ${result.lines.join(" | ")}`,
  );
  assert.ok(
    result.lines.every((line) => !/NO_COLOR|trace-warnings/i.test(line)),
    `the runner's color warning stays out: ${result.lines.join(" | ")}`,
  );
});
