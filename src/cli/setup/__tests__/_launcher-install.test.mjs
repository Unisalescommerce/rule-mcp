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
*/

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { installLauncher, installedVersions, launcherRoot, setCurrent, currentVersion } from "../_launcher-install.js";

const home = mkdtempSync(join(tmpdir(), "rule-launcher-"));
const root = join(home, ".rule-mcp");

test.after(() => rmSync(home, { recursive: true, force: true }));

/** A runner that records the command and writes the entry point the deploy would. */
function fakeRunner() {
  const calls = [];

  const run = (command, args, options = {}) => {
    calls.push({ command, args, options });

    const target = args.at(-1);

    if (String(target).startsWith(home)) {
      mkdirSync(join(target, "bin"), { recursive: true });
      writeFileSync(join(target, "bin/rule-mcp.js"), "// entry\n");
      writeFileSync(join(target, "package.json"), JSON.stringify({ version: "1.0.0" }));
    }

    return { status: 0, stdout: "0.1.0\n" };
  };

  run.calls = calls;

  return run;
}

test.beforeEach(() => {
  rmSync(launcherRoot({ root }), { recursive: true, force: true });
});

test("an install deploys, points the pointer at the version and records it", () => {
  const run = fakeRunner();
  const result = installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run, now: () => "2026-10-29" });

  assert.equal(result.status, "installed");
  assert.equal(existsSync(join(launcherRoot({ root }), "1.0.0/bin/rule-mcp.js")), true, "the copy has an entry point");
  assert.equal(currentVersion({ root }), "1.0.0", "and the pointer names it");
  assert.deepEqual(installedVersions({ root }), [{ version: "1.0.0", source: "/tmp/checkout", installedAt: "2026-10-29" }]);

  const deploy = run.calls[0];

  assert.equal(deploy.command, "pnpm");
  assert.deepEqual(deploy.args.slice(0, 3), ["deploy", "--prod", "--legacy"], "the mechanism the measurement chose");
  assert.equal(deploy.args[3], join(launcherRoot({ root }), "1.0.0"));
});

test("a second install of the same version verifies instead of rewriting", () => {
  installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run: fakeRunner(), now: () => "2026-10-29" });

  const run = fakeRunner();
  const again = installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run, now: () => "2026-10-30" });

  assert.equal(again.status, "verified");
  assert.equal(run.calls.length, 0, "nothing is deployed twice");
  assert.equal(installedVersions({ root }).length, 1, "and no second row is recorded");
});

test("a new version adds a directory, moves the pointer and prunes the old copy", () => {
  installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run: fakeRunner(), now: () => "2026-10-29" });
  const result = installLauncher({ checkout: "/tmp/checkout", version: "1.1.0", root, run: fakeRunner(), now: () => "2026-10-30" });

  assert.equal(result.status, "installed");
  assert.equal(currentVersion({ root }), "1.1.0");
  assert.deepEqual(result.pruned, ["1.0.0"], "the copy it replaced is gone");
  assert.equal(existsSync(join(launcherRoot({ root }), "1.0.0")), false);
  assert.deepEqual(installedVersions({ root }).map((row) => row.version), ["1.1.0"]);
});

test("a dry run reports and writes nothing", () => {
  const run = fakeRunner();
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
