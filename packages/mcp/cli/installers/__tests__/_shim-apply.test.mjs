/**
 * The global launcher: probed, healed, and removed.
 *
 * A shim pins the absolute path of the repo it was created from. Move the
 * project and it stays on PATH and crashes on launch, and every agent install
 * after it fails silently (ADR 045). This was a contract asserted against the
 * bash in install.sh; the bash is a bootstrap now (ADR 090), so the same
 * contract is asserted against the node that replaced it.
 *
 * Every case runs in a child process with its own HOME, PATH and PNPM_HOME: the
 * module reads the real PATH to find the shim, and a test that let it see this
 * machine's would depend on this machine. The harness is `_shim-apply-child.fixture.mjs`.
 */
import { strict as assert } from "node:assert";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { isRemoved, localBin, run, sandbox } from "./_shim-apply-child.fixture.mjs";

test("a shim that does not launch is rewritten, not trusted", () => {
  const box = sandbox({ brokenShim: true });

  try {
    const result = run(`ensureGlobalShim({ localBin: ${JSON.stringify(localBin)} })`, box);

    assert.equal(result.status, "relinked", JSON.stringify(result));

    const written = readFileSync(result.path, "utf8");

    assert.match(written, /^#!\/bin\/sh/, "the shim is a launcher script");
    assert.ok(written.includes(JSON.stringify(localBin)), "the launcher points at this checkout");
    assert.doesNotMatch(written, /pnpm link --global/, "pnpm 10+ rewrites pnpm-workspace.yaml and the lockfile");
  } finally {
    rmSync(box.home, { recursive: true, force: true });
  }
});

test("no shim at all is a shim created", () => {
  const box = sandbox();

  try {
    const result = run(`ensureGlobalShim({ localBin: ${JSON.stringify(localBin)} })`, box);

    assert.equal(result.status, "created", JSON.stringify(result));
    assert.equal(result.path, join(box.home, ".pnpm", "bin", "rule-mcp"), "PNPM_HOME/bin wins when it is set");
  } finally {
    rmSync(box.home, { recursive: true, force: true });
  }
});

test("the escape hatch writes nothing, and says which one it is", () => {
  const box = sandbox({ brokenShim: true });

  try {
    const result = run(`ensureGlobalShim({ localBin: ${JSON.stringify(localBin)} })`, { ...box, skip: true });

    assert.equal(result.status, "skipped");
    assert.match(result.reason, /RULE_MCP_SKIP_GLOBAL_LINK/);
    assert.equal(readFileSync(join(box.bin, "rule-mcp"), "utf8"), "#!/bin/sh\nexit 3\n", "the stale shim is left");
  } finally {
    rmSync(box.home, { recursive: true, force: true });
  }
});

test("a dry run plans the write and performs none of it", () => {
  const box = sandbox();

  try {
    const result = run(`ensureGlobalShim({ localBin: ${JSON.stringify(localBin)}, dryRun: true })`, box);

    assert.equal(result.status, "planned");
    assert.throws(() => readFileSync(join(box.home, ".pnpm", "bin", "rule-mcp"), "utf8"));
  } finally {
    rmSync(box.home, { recursive: true, force: true });
  }
});

test("a removal sweeps the current name and the retired alias", () => {
  const box = sandbox();
  const dir = join(box.home, ".pnpm", "bin");

  mkdirSync(dir, { recursive: true });

  for (const name of ["rule-mcp", "rule-mcpd"]) {
    writeFileSync(join(dir, name), "#!/bin/sh\nexit 0\n");
  }

  try {
    const removed = run("removeGlobalShims()", box);
    const paths = removed.map((entry) => entry.path);

    // The -mcpd alias is retired (ADR 061): a stale shim keeps `command -v`
    // resolving forever and silently breaks the next install.
    assert.deepEqual(new Set(paths), new Set([join(dir, "rule-mcp"), join(dir, "rule-mcpd")]));
    assert.ok(removed.every(isRemoved), JSON.stringify(removed));
    assert.deepEqual(run("removeGlobalShims()", box), [], "a second removal finds nothing left");
  } finally {
    rmSync(box.home, { recursive: true, force: true });
  }
});
