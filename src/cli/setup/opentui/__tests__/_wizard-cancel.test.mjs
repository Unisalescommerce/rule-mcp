/** Cancelling the install writes nothing at all. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { CANCEL, fakeScreen, reset, runInstallWizard } from "./_wizard.fixture.mjs";

test("canceling at any step writes nothing", async () => {
  reset();
  const screen = fakeScreen(["next", CANCEL]);

  assert.equal(await runInstallWizard({ screen }), null);
  assert.deepEqual(globalThis.__wizardStub.plans, []);
});
