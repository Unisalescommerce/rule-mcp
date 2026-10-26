/**
 * A gate that cannot run must not make the repository unusable.
 *
 * That sentence is in `_hook.js` and it was not true. The hook probed the
 * launcher with `command -v`, which passes for a shim whose target is gone:
 * pointing the checkout at a branch without `bin/rule-mcp.js` left a launcher
 * that exists, cannot run, and turns every `git push` on the machine into a
 * node stack trace. The probe now runs the launcher and asks whether it answers.
 */
import { strict as assert } from "node:assert";
import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { hookBody } from "../_hook.js";

/** Run the hook body as git would, with a PATH holding the given launcher. */
function runHook(body, launcher, { barePath = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-hook-"));

  writeFileSync(join(dir, "pre-push"), body);
  chmodSync(join(dir, "pre-push"), 0o755);

  if (launcher) {
    writeFileSync(join(dir, "rule-mcp"), launcher);
    chmodSync(join(dir, "rule-mcp"), 0o755);
  }

  return spawnHook(dir, "pre-push", barePath ? `${dir}:/usr/bin:/bin` : `${dir}:${process.env.PATH}`);
}

function spawnHook(dir, name, path) {
  // spawnSync, because a passing hook still says why it is passing and
  // execFileSync only hands back stderr when something throws.
  const result = spawnSync("sh", [join(dir, name)], { encoding: "utf8", input: "", env: { ...process.env, PATH: path } });

  return { status: result.status ?? 1, stdout: `${result.stdout ?? ""}`, stderr: `${result.stderr ?? ""}` };
}

test("a launcher that exists but cannot run does not block the push", () => {
  // Exactly what the machine had: a shim whose target moved with a branch.
  const broken = ["#!/bin/sh", 'echo "Cannot find module" >&2', "exit 1", ""].join("\n");
  const result = runHook(hookBody("pre-push"), broken);

  assert.equal(result.status, 0, "an unstartable validator lets the push through");
});

test("the skip names the reason instead of failing silently", () => {
  const broken = ["#!/bin/sh", "exit 127", ""].join("\n");
  const result = runHook(hookBody("pre-push"), broken);

  assert.match(result.stderr, /cannot run/u, "the reader is told the validation was skipped");
});

test("a working launcher's rejection still blocks", () => {
  const rejecting = ["#!/bin/sh", 'if [ "$1" = "--version" ]; then echo 1.0.0; exit 0; fi', "exit 1", ""].join("\n");
  const result = runHook(hookBody("pre-push"), rejecting);

  assert.equal(result.status, 1, "a verdict of `violations` is still a verdict");
});

test("no launcher at all is still a skip, not a failure", () => {
  // A bare PATH, because this machine has a real `rule-mcp` on it and the point
  // of the case is the absence of one.
  const result = runHook(hookBody("pre-push"), null, { barePath: true });

  assert.equal(result.status, 0);
  assert.match(result.stderr, /not on PATH/u);
});
