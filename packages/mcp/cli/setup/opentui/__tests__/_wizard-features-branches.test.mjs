/** The features step can stop on a level or on attribution, and skips a known answer. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { featureIds } from "../../../../core/runtime/features/index.js";
import { BACK, CANCEL } from "../_answers.js";
import { askFeatures } from "../_wizard-features.js";

const preset = () => Object.fromEntries(featureIds().map((id) => [id, "on"]));

for (const [name, leave] of [
  ["cancel", CANCEL],
  ["back", BACK],
]) {
  test(`${name} on a feature level leaves the step`, async () => {
    const answers = { features: {} };

    assert.equal(await askFeatures({ screen: { ask: async () => leave }, answers }), leave);
    assert.deepEqual(answers.features, {});
  });

  test(`${name} on attribution leaves the step, with no level asked again`, async () => {
    const titles = [];
    const screen = {
      ask: async (question) => {
        titles.push(question.title);

        return leave;
      },
    };

    assert.equal(await askFeatures({ screen, answers: { features: preset() } }), leave);
    assert.deepEqual(titles, ["Commit attribution"]);
  });
}
