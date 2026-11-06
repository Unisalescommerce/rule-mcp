/**
@module test/setup/launcher-install-deploy

The deploy command line, which the launcher's layout tests do not see.

A workspace root holds more than one project, so `pnpm deploy` there answers
`ERR_PNPM_CANNOT_DEPLOY_MANY — Cannot deploy more than 1 project`. The filter is
what names the one project to copy, and the checkout's own manifest is what names
it: a hardcoded package name would rot at the next rename.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { installLauncher, launcherRoot } from "../_launcher-install.js";
import { fakeRunner, launcherSandbox } from "./_launcher-install.fixture.mjs";

const box = launcherSandbox();
const { root } = box;

test.after(box.cleanup);

test.beforeEach(() => {
  rmSync(launcherRoot({ root }), { recursive: true, force: true });
});

/** A checkout with a manifest, and a workspace file when it is a workspace root. */
function checkout({ name, workspace }) {
  const dir = mkdtempSync(join(tmpdir(), "rule-launcher-checkout-"));

  writeFileSync(join(dir, "package.json"), JSON.stringify({ name, version: "1.0.0" }));

  if (workspace) {
    writeFileSync(join(dir, "pnpm-workspace.yaml"), 'packages:\n  - "packages/*"\n');
  }

  return dir;
}

test("a workspace checkout deploys through a filter naming its own package", () => {
  const dir = checkout({ name: "rule-mcp-workspace", workspace: true });
  const run = fakeRunner(box.home);

  try {
    installLauncher({ checkout: dir, version: "1.0.0", root, run, now: () => "2026-11-06" });

    assert.deepEqual(run.calls[0].args, ["--filter", "rule-mcp-workspace", "deploy", "--prod", "--legacy", join(launcherRoot({ root }), "1.0.0")]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a checkout that is not a workspace keeps the plain deploy", () => {
  const dir = checkout({ name: "rule-mcp", workspace: false });
  const run = fakeRunner(box.home);

  try {
    installLauncher({ checkout: dir, version: "1.0.0", root, run, now: () => "2026-11-06" });

    assert.deepEqual(run.calls[0].args, ["deploy", "--prod", "--legacy", join(launcherRoot({ root }), "1.0.0")]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a failed deploy removes the directory it created", () => {
  const run = () => {
    throw new Error("ERR_PNPM_CANNOT_DEPLOY_MANY");
  };
  const result = installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run });

  assert.equal(result.status, "failed");
  // An empty launcher directory is a copy the record does not name and the next
  // install cannot tell apart from a real one: it goes with the failure.
  assert.equal(existsSync(result.dir), false, "no half-deployed copy survives");
});
