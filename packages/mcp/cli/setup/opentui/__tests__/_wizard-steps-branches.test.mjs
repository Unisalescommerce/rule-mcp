/** Every question of both flows can stop the wizard, and every one can step back. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { BACK, CANCEL, FEATURE_ANSWERS, SCOPE_ANSWER, fakeScreen, reset, runInstallWizard, runUninstallWizard } from "./_wizard.fixture.mjs";

const INSTALL = ["next", "standard", ["claude"], SCOPE_ANSWER, "auto", "stdio", "standard", ...FEATURE_ANSWERS];

for (let step = 1; step <= INSTALL.length; step += 1) {
  test(`install: cancel after ${step} answer(s) writes nothing`, async () => {
    reset();

    assert.equal(await runInstallWizard({ screen: fakeScreen([...INSTALL.slice(0, step), CANCEL]) }), null);
    assert.deepEqual(globalThis.__wizardStub.plans, []);
  });

  test(`install: back after ${step} answer(s) then cancel writes nothing`, async () => {
    reset();

    assert.equal(await runInstallWizard({ screen: fakeScreen([...INSTALL.slice(0, step), BACK, CANCEL]) }), null);
    assert.deepEqual(globalThis.__wizardStub.plans, []);
  });
}

test("a custom surface asks for the areas and the skills, and each can stop the flow", async () => {
  for (const leave of [CANCEL, BACK]) {
    reset();
    const head = ["next", "standard", ["claude"], SCOPE_ANSWER, "auto", "stdio", "custom"];

    await runInstallWizard({ screen: fakeScreen([...head, leave, CANCEL]) });
    await runInstallWizard({ screen: fakeScreen([...head, ["frontend"], leave, CANCEL]) });
  }

  assert.deepEqual(globalThis.__wizardStub.plans, []);
});

test("defaults from the flags seed the answers", async () => {
  reset();

  const defaults = {
    scope: "project",
    projects: ["/tmp/x"],
    projectConfig: "local",
    dryRun: true,
    features: ["adr=on", "broken"],
    attribution: "hide",
  };

  assert.equal(await runInstallWizard({ screen: fakeScreen(["next", CANCEL]), defaults }), null);
});

test("uninstall: each answer can stop or step back", async () => {
  for (const leave of [CANCEL, BACK]) {
    for (const script of [
      [leave, CANCEL],
      [["group"], leave, CANCEL],
      [["group"], [], leave, CANCEL],
      [["group"], [], "dry", leave, CANCEL],
    ]) {
      reset();
      globalThis.__wizardStub.scan = {
        groups: [{ id: "group", label: "Group", items: [{ id: "one", label: "One" }] }],
        purge: [{ id: "purge", label: "Purge", dir: "/tmp/x", exists: true, files: 1 }],
        agents: [],
      };

      await runUninstallWizard({ screen: fakeScreen(script) });
    }
  }

  assert.deepEqual(globalThis.__wizardStub.plans, []);
});
