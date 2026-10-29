/**
 * A launcher whose target moved says so, in a code a caller can read.
 *
 * The generated shim was `exec node "<absolute path>"`, so a checkout on a branch
 * without that path produced a node stack trace and exit 1 - indistinguishable
 * from "the validator found violations" for the git hook that called it, which
 * then blocked every push on the machine. The launcher now checks its target and
 * exits 127, which means `cannot execute` and nothing else.
 */
import { strict as assert } from "node:assert";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ensureGlobalShim, launcher } from "../_shim-apply.js";

/** A runtime root with no copy in it, so the launcher has to fall through. */
const emptyRoot = () => mkdtempSync(join(tmpdir(), "rule-mcp-shim-root-"));

/** Write a launcher for a target and run it the way the shell would. */
function run(localBin) {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-shim-"));
  const shim = join(dir, "rule-mcp");

  writeFileSync(shim, launcher(localBin, { root: emptyRoot() }));
  chmodSync(shim, 0o755);

  return spawnSync("sh", [shim], { encoding: "utf8" });
}

test("a missing target exits 127 and names the path", () => {
  const missing = join(tmpdir(), "no-such-checkout", "bin", "rule-mcp.js");
  const result = run(missing);

  assert.equal(result.status, 127, "127 is `cannot execute`, which a hook can tell apart from a verdict");
  assert.match(result.stderr, /rule-mcp launcher:/u, "the message comes from the launcher, not from node");
  assert.ok(!/MODULE_NOT_FOUND|node:internal/u.test(result.stderr), "no stack trace reaches the reader");
  assert.ok(result.stderr.includes(missing), "the message names the checkout it looked for");
  assert.match(result.stderr, /rule-mcp setup/u, "and the command that repairs it");
});

test("a shim that runs but predates the target check is rewritten", () => {
  // The machine had exactly this: a working launcher, written before the guard,
  // that kept turning a moved entry point into a node stack. `shimWorks` says yes
  // to it, so the text is what decides.
  //
  // The whole lookup is sandboxed - `PNPM_HOME`, `PATH`, and the guard the
  // installer ships - because `ensureGlobalShim` resolves the shim through
  // `command -v` and would otherwise rewrite the machine's real one. An earlier
  // version of this test deleted it.
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-shim-refresh-"));
  const bin = join(home, "bin");
  const target = join(home, "entry.js");
  const shim = join(bin, "rule-mcp");
  const saved = { PNPM_HOME: process.env.PNPM_HOME, PATH: process.env.PATH };

  mkdirSync(bin, { recursive: true });
  writeFileSync(target, 'console.log("ok");\n');
  process.env.PNPM_HOME = home;
  process.env.PATH = `${bin}:/usr/bin:/bin`;

  try {
    const first = ensureGlobalShim({ localBin: target });
    const old = ["#!/bin/sh", `exec node ${JSON.stringify(target)} "$@"`, ""].join("\n");

    writeFileSync(shim, old);

    const second = ensureGlobalShim({ localBin: target });

    assert.equal(first.path, shim, "the sandbox is where the shim is written");
    assert.notEqual(second.status, "verified", "an old body is not verified just because it runs");
    assert.match(readFileSync(shim, "utf8"), /rule-mcp launcher: cannot start\./u, "the resolution guard is what a refresh installs");
  } finally {
    process.env.PNPM_HOME = saved.PNPM_HOME ?? "";
    process.env.PATH = saved.PATH ?? "";
  }
});

test("the launcher still runs a checkout that exists", () => {
  const dir = mkdtempSync(join(tmpdir(), "rule-mcp-shim-ok-"));
  const target = join(dir, "ok.js");

  writeFileSync(target, 'console.log("target ran");\n');

  const result = run(target);

  assert.equal(result.status, 0, "a good target runs, and its exit code is its own");
  assert.match(result.stdout, /target ran/u);
});
