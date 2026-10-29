/**
@module test/setup/screen-path

The path field driven by keystrokes through the real screen.

`@opentui/core` is replaced by a fake renderer that keeps the nodes it is given
and replays keys into the handler the screen installed. Everything under test is
the screen's own: what it mounts, what it reads back, what it resolves with.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@opentui/core") {
      return { url: pathToFileURL(join(import.meta.dirname, "_screen-path.stub.mjs")).href, shortCircuit: true };
    }

    return nextResolve(specifier, context);
  },
});

const { openScreen } = await import("../_screen.js");
const { BACK, CANCEL } = await import("../_answers.js");

const root = mkdtempSync(join(tmpdir(), "rule-screen-path-"));

mkdirSync(join(root, "alpha"));
mkdirSync(join(root, "beta"));

test.after(() => rmSync(root, { recursive: true, force: true }));

/** Open a screen, ask for a path, and return the promise plus the renderer. */
const ask = async (options = {}) => {
  const screen = await openScreen({ title: "test" });
  const answer = screen.askPath({ title: "Project root", cwd: root, ...options });

  return { answer, renderer: globalThis.__fakeRenderer, screen };
};

const type = (renderer, sequence) => renderer.press({ name: undefined, sequence });

test("Tab opens the menu, and the rows name the folders", async () => {
  const { answer, renderer } = await ask();

  type(renderer, "./");
  renderer.press({ name: "tab" });

  const frame = globalThis.__fakeRenderer.root.text;

  assert.ok(frame.includes("alpha"), `the menu lists the folders: ${frame}`);
  assert.ok(frame.includes("1/2"), "and the footer says where the cursor is");

  renderer.press({ name: "escape" });
  renderer.press({ name: "escape" });
  assert.equal(await answer, BACK);
});

test("Tab applies the selected row, and the field carries its value", async () => {
  const { answer, renderer } = await ask();

  type(renderer, "./");
  renderer.press({ name: "tab" });
  renderer.press({ name: "down" });
  renderer.press({ name: "tab" });

  assert.ok(globalThis.__fakeRenderer.root.text.includes("./beta/"), "the field took the row's value");
  renderer.press({ name: "return" });
  assert.equal(await answer, join(root, "beta"));
});

test("Enter on a path that is not a folder keeps the field open with the reason", async () => {
  const { answer, renderer } = await ask();

  type(renderer, "./nope");
  renderer.press({ name: "return" });

  assert.ok(globalThis.__fakeRenderer.root.text.includes("Not a folder:"), "the refusal is on screen");

  type(renderer, "");
  renderer.press({ name: "escape" });
  assert.equal(await answer, BACK);
});

test("Ctrl+C cancels the field", async () => {
  const { answer, renderer } = await ask();

  renderer.press({ name: "c", ctrl: true });

  assert.equal(await answer, CANCEL);
});

test("a text field types q instead of quitting", async () => {
  const { answer, renderer } = await ask();

  type(renderer, "./qq");
  renderer.press({ name: "tab" });

  assert.ok(globalThis.__fakeRenderer.root.text.includes("./qq"), "a q in the path is a character, not a command");

  renderer.press({ name: "escape" });
  renderer.press({ name: "escape" });
  assert.equal(await answer, BACK);
});
