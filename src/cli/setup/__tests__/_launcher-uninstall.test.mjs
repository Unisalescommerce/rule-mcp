/**
@module test/setup/launcher-uninstall

Phase 4: uninstall removes `~/.rule-mcp/launcher/` then the PATH shim, in that
order, and reports what it removed. Leaving a shim that points at a deleted
copy is the incident in reverse.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { installLauncher, launcherRoot, removeLauncher } from "../_launcher-install.js";
import { buildUninstallPlan } from "../_plan-uninstall.js";

const home = mkdtempSync(join(tmpdir(), "rule-launcher-un-"));
const root = join(home, ".rule-mcp");

test.after(() => rmSync(home, { recursive: true, force: true }));

function fakeRunner() {
  return (command, args) => {
    const target = args.at(-1);

    if (String(target).startsWith(home)) {
      mkdirSync(join(target, "bin"), { recursive: true });
      writeFileSync(join(target, "bin/rule-mcp.js"), "// entry\n");
      writeFileSync(join(target, "package.json"), JSON.stringify({ version: "1.0.0" }));
    }

    return { status: 0, stdout: "1.0.0\n" };
  };
}

test.beforeEach(() => {
  rmSync(launcherRoot({ root }), { recursive: true, force: true });
});

test("removeLauncher deletes the copy directory and reports it", () => {
  installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run: fakeRunner(), now: () => "2026-10-30" });

  const result = removeLauncher({ root });

  assert.equal(result.status, "removed");
  assert.equal(existsSync(launcherRoot({ root })), false);
  assert.ok(result.lines.some((line) => line.includes("launcher")), "reports what left");
});

test("a dry run plans the removal and writes nothing", () => {
  installLauncher({ checkout: "/tmp/checkout", version: "1.0.0", root, run: fakeRunner(), now: () => "2026-10-30" });

  const result = removeLauncher({ root, dryRun: true });

  assert.equal(result.status, "planned");
  assert.equal(existsSync(launcherRoot({ root })), true);
});

test("nothing to remove is reported without inventing a deletion", () => {
  const result = removeLauncher({ root });

  assert.equal(result.status, "absent");
  assert.equal(existsSync(launcherRoot({ root })), false);
});

test("the uninstall plan runs launcher removal before the shim", () => {
  const plan = buildUninstallPlan({ groups: ["launcher", "shim"] });
  const ids = plan.map((task) => task.id);

  assert.ok(ids.includes("launcher"), "launcher is a removable group");
  assert.ok(ids.includes("shim"));
  assert.ok(ids.indexOf("launcher") < ids.indexOf("shim"), "copy goes before the PATH entry");
});
