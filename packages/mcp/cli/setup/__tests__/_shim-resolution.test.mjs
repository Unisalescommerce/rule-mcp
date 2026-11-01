/**
@module test/setup/shim-resolution

The launcher's resolution order, run as the shell would run it.

The copy wins because the copy has no branch: a checkout that moves is the
incident, and a launcher that names a path into one inherits it. The checkout is
the second answer, not the first, because a developer working on the tool wants
their edits live only when the copy cannot answer. Neither leaves exit 127 naming
both paths and the command that repairs them.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { launcher } from "../_shim-apply.js";

const sandbox = mkdtempSync(join(tmpdir(), "rule-shim-resolution-"));

test.after(() => rmSync(sandbox, { recursive: true, force: true }));

/** A copy of a version under the launcher root, the way the install writes it. */
function copyOf(root, version, body = 'console.log("copy ran");\n') {
  const launcherDir = join(root, "launcher");
  const dir = join(launcherDir, version);

  mkdirSync(join(dir, "bin"), { recursive: true });
  writeFileSync(join(dir, "bin", "rule-mcp.js"), body);
  writeFileSync(join(launcherDir, "current"), `${version}\n`);

  return dir;
}

/** Write the launcher and run it with the given arguments. */
function run({ root, checkout, args = [] }) {
  const dir = mkdtempSync(join(sandbox, "run-"));
  const shim = join(dir, "rule-mcp");

  writeFileSync(shim, launcher(checkout, { root }));
  chmodSync(shim, 0o755);

  return spawnSync("sh", [shim, ...args], { encoding: "utf8" });
}

test("the copy runs, and it runs first", () => {
  const root = join(sandbox, "precedence");
  const entry = join(sandbox, "checkout-entry.js");

  writeFileSync(entry, 'console.log("checkout ran");\n');
  copyOf(root, "1.0.0");

  const result = run({ root, checkout: entry });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /copy ran/u, "the copy answers even when the checkout could");
  assert.doesNotMatch(result.stdout, /checkout ran/u);
});

test("a broken copy falls through to the checkout", () => {
  const root = join(sandbox, "fallback");
  const entry = join(sandbox, "fallback-entry.js");

  writeFileSync(entry, 'console.log("checkout ran");\n');
  copyOf(root, "1.0.0");
  rmSync(join(root, "launcher", "1.0.0", "bin", "rule-mcp.js"), { force: true });

  const result = run({ root, checkout: entry });

  assert.match(result.stdout, /checkout ran/u, "a developer's edits stay live when the copy cannot answer");
});

test("an unreadable pointer is the same as no pointer", () => {
  const root = join(sandbox, "garbage");
  const entry = join(sandbox, "garbage-entry.js");

  writeFileSync(entry, 'console.log("checkout ran");\n');
  mkdirSync(join(root, "launcher"), { recursive: true });
  writeFileSync(join(root, "launcher", "current"), "\u0000 not a version\n");

  const result = run({ root, checkout: entry });

  assert.equal(result.status, 0, "the pointer is read, not trusted");
  assert.match(result.stdout, /checkout ran/u);
});

test("with neither, exit 127 names both paths and the repair", () => {
  const root = join(sandbox, "neither");
  const entry = join(sandbox, "gone", "bin", "rule-mcp.js");
  const result = run({ root, checkout: entry });

  assert.equal(result.status, 127, "127 is `cannot execute`, which a hook can tell apart from a verdict");
  assert.ok(result.stderr.includes(entry), "the checkout path it looked for");
  assert.ok(result.stderr.includes(join(root, "launcher", "current")), "and the pointer it read");
  assert.match(result.stderr, /rule-mcp setup/u, "and the command that repairs it");
  assert.ok(!/node:internal|MODULE_NOT_FOUND/u.test(result.stderr), "no stack trace reaches the reader");
});

test("the target's own exit code is passed through", () => {
  const root = join(sandbox, "exit");
  const dir = copyOf(root, "2.0.0", 'process.exit(3);\n');

  assert.equal(run({ root, checkout: join(sandbox, "no-checkout.js") }).status, 3, "the launcher does not invent an exit code");
  assert.ok(readFileSync(join(dir, "bin", "rule-mcp.js"), "utf8").includes("process.exit"));
});

test("arguments reach the target untouched", () => {
  const root = join(sandbox, "args");

  copyOf(root, "3.0.0", 'console.log(JSON.stringify(process.argv.slice(2)));\n');

  const result = run({ root, checkout: join(sandbox, "no-checkout.js"), args: ["--version", "a b"] });

  assert.deepEqual(JSON.parse(result.stdout.trim()), ["--version", "a b"]);
});
