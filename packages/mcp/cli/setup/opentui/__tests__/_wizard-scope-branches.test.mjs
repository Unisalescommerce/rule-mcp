/** Each question of the scope step can stop the wizard or step back. */
import { strict as assert } from "node:assert";
import test from "node:test";

import { BACK, CANCEL } from "../_answers.js";
import { askScope } from "../_wizard-scope.js";

/** A screen that gives these answers in order. */
const scripted = (...replies) => ({ ask: async () => replies.shift(), path: async () => replies.shift(), askPath: async () => replies.shift() });

for (const [name, leave] of [
  ["cancel", CANCEL],
  ["back", BACK],
]) {
  test(`${name} on the first question leaves the answers alone`, async () => {
    const answers = {};

    assert.equal(await askScope({ screen: scripted(leave), answers }), leave);
    assert.equal(answers.scope, undefined);
  });

  test(`${name} on the project question leaves the step`, async () => {
    assert.equal(await askScope({ screen: scripted("project", leave), answers: {} }), leave);
  });

  test(`${name} on the kind question leaves the step`, async () => {
    assert.equal(await askScope({ screen: scripted("project", ["cwd"], leave), answers: {} }), leave);
  });
}

test("the step offers the earlier answers again", async () => {
  const asked = [];
  const screen = {
    ask: async (question) => {
      asked.push(question.initial);

      return asked.length === 1 ? "project" : asked.length === 2 ? "cwd" : "local";
    },
  };
  const answers = { scope: "project", projectConfig: "local" };

  await askScope({ screen, answers });

  assert.deepEqual(asked[0], ["project"]);
  assert.deepEqual(asked[2], ["local"]);
  assert.equal(answers.projects.length, 1, "one answer, not a list, still counts");
});

for (const [name, leave] of [
  ["cancel", CANCEL],
  ["back", BACK],
]) {
  test(`${name} on a typed path leaves the step`, async () => {
    assert.equal(await askScope({ screen: scripted("project", ["p"], leave), answers: {} }), leave);
  });
}
