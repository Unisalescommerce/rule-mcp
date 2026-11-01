/**
 * The renderer options the wizard asks OpenTUI for.
 *
 * The alternate screen is what keeps the user's scrollback intact, and the
 * wizard owns Ctrl+C so quitting from a list cannot skip the teardown that
 * restores the cursor. Both are asserted here because both are invisible
 * until they are wrong.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { rendererOptions } from "../_mount.js";

test("the wizard owns the alternate screen and its own Ctrl+C", () => {
  const options = rendererOptions();

  assert.equal(options.screenMode, "alternate-screen", "the frame owns the window, scrollback survives");
  assert.equal(options.exitOnCtrlC, false, "the flow tears the renderer down itself");
  assert.equal(options.useMouse, true, "selection and scroll work with a mouse");
  assert.equal(options.targetFps, 30, "an installer does not need 60 frames a second");
});
