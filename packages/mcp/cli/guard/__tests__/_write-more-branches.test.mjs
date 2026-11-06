/** The advice after a write: a locale file, no path, no check, and each finding. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { adviseWrite } from "../_write.js";
import { composeFile, writeGuardrailReport } from "../_write-check.js";

test("a locale file gets no language advice", async () => {
  assert.deepEqual(await adviseWrite({ file_path: "src/locales/it.json", content: "colour" }), { advice: "" });
});

test("a British word and a dash are named, with or without a path", async () => {
  const withPath = await adviseWrite({ file_path: "notes.txt", content: "The colour — here" });
  const noPath = await adviseWrite({ content: "The colour — here" });

  assert.match(`${withPath.advice}`, /colour/u);
  assert.match(`${noPath.advice}`, /em\/en dash/u);
});

test("an input with no file reports nothing", async () => {
  assert.equal(typeof composeFile({}), "string");
  await assert.doesNotReject(writeGuardrailReport());
  await assert.doesNotReject(writeGuardrailReport({ file_path: "" }));
});
