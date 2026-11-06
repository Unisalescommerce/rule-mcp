/**
@module test/setup/launcher-install

The launcher copy: one directory per version under `~/.rule-mcp/launcher/`, a
pointer file naming the one in use, and a record of what this installer wrote.

Measured before the module was written, because the plan was built on `pnpm pack`:
the tarball is 1.2 MB packed and 6.8 MB extracted and cannot start (`commander`
is missing, and OpenTUI's platform binary is not packed at all). `pnpm deploy
--prod` produces 85 MB with its dependencies and the platform binary, and
`bin/rule-mcp.js --version` answers from it. The mechanism follows the
measurement; the layout the plan asked for does not change.

The command line itself is a separate concern: `_launcher-install-deploy.test.mjs`.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import { installLauncher, installedVersions, launcherRoot, setCurrent, currentVersion } from "../_launcher-install.js";
import { fakeRunner, launcherSandbox } from "./_launcher-install.fixture.mjs";

const box = launcherSandbox();
const { root } = box;

test.after(box.cleanup);

test.beforeEach(() => {
  rmSync(launcherRoot({ root }), { recursive: true, force: true });
});

test("an install deploys, points the pointer at the version and records it", () => {
  const run = fakeRunner(box.home);
  const result = installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run, now: () => "2026-10-29" });

  assert.equal(result.status, "installed");
  assert.equal(existsSync(join(launcherRoot({ root }), "1.0.0/bin/rule-mcp.js")), true, "the copy has an entry point");
  assert.equal(currentVersion({ root }), "1.0.0", "and the pointer names it");
  assert.deepEqual(installedVersions({ root }), [{ version: "1.0.0", source: "/tmp/checkout", installedAt: "2026-10-29" }]);
  assert.equal(run.calls[0].command, "pnpm");
});

test("a second install of the same version verifies instead of rewriting", () => {
  installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run: fakeRunner(box.home), now: () => "2026-10-29" });

  const run = fakeRunner(box.home);
  const again = installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run, now: () => "2026-10-30" });

  assert.equal(again.status, "verified");
  assert.equal(run.calls.length, 0, "nothing is deployed twice");
  assert.equal(installedVersions({ root }).length, 1, "and no second row is recorded");
});

test("a new version adds a directory, moves the pointer and prunes the old copy", () => {
  installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run: fakeRunner(box.home), now: () => "2026-10-29" });
  const result = installLauncher({ checkout: "/tmp/checkout", version: "1.1.0", root, run: fakeRunner(box.home), now: () => "2026-10-30" });

  assert.equal(result.status, "installed");
  assert.equal(currentVersion({ root }), "1.1.0");
  assert.deepEqual(result.pruned, ["1.0.0"], "the copy it replaced is gone");
  assert.equal(existsSync(join(launcherRoot({ root }), "1.0.0")), false);
  assert.deepEqual(
    installedVersions({ root }).map((row) => row.version),
    ["1.1.0"],
  );
});

test("a dry run reports and writes nothing", () => {
  const run = fakeRunner(box.home);
  const result = installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run, dryRun: true });

  assert.equal(result.status, "planned");
  assert.equal(run.calls.length, 0);
  assert.equal(existsSync(launcherRoot({ root })), false);
  assert.equal(currentVersion({ root }), undefined);
});

test("a failed deploy leaves no pointer and says what failed", () => {
  const run = () => {
    throw new Error("pnpm not found");
  };
  const result = installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run });

  assert.equal(result.status, "failed");
  assert.match(result.reason, /pnpm not found/u);
  assert.equal(currentVersion({ root }), undefined, "a pointer to nothing would be the incident again");
});

test("the pointer file is a plain word, so a rollback is an edit", () => {
  mkdirSync(launcherRoot({ root }), { recursive: true });
  setCurrent({ root, version: "0.9.0" });

  assert.equal(readFileSync(join(launcherRoot({ root }), "current"), "utf8").trim(), "0.9.0");
  assert.equal(currentVersion({ root }), "0.9.0");
});
