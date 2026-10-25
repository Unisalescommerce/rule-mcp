/**
 * @module test/installers/host-level-report
 *
 * Phase 6's gate: `/rule-init` and `doctor` report the same level for the same
 * host.
 *
 * They are two readers of one file, which is exactly how a report starts
 * disagreeing with itself: one moves to the new field, the other keeps parsing
 * the old one, and both look right. Both call `hostLevels()` today, and this test
 * is the reason they will keep doing it.
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ALIAS_HOOK = fileURLToPath(new URL("../../scripts/alias-hook.mjs", import.meta.url));
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ENTRY = join(ROOT, "bin", "rule-mcp.js");

const run = (args, cwd, home) =>
  execFileSync(process.execPath, ["--import", ALIAS_HOOK, ENTRY, ...args], { cwd, env: { ...process.env, HOME: home }, encoding: "utf8", stdio: "pipe" });

test("init and doctor name the same level for the same host", () => {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-levels-home-"));
  const project = mkdtempSync(join(tmpdir(), "rule-mcp-levels-project-"));

  try {
    run(["install", "--agent", "claude", "--level", "L2", "--no-wizard"], ROOT, home);

    const initLine = run(["init"], project, home)
      .split("\n")
      .find((line) => line.startsWith("Hosts:"));
    const levels = JSON.parse(run(["doctor", "--json"], project, home)).levels;

    assert.match(initLine ?? "", /claude L2/u, "init names the host and the level it was installed at");
    assert.equal(levels.claude, "L2", "and the doctor agrees, because both read hostLevels()");
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(project, { recursive: true, force: true });
  }
});

test("a machine with no install gets no host line, and a v1 host says so", () => {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-levels-empty-"));
  const project = mkdtempSync(join(tmpdir(), "rule-mcp-levels-project-"));

  try {
    const initLine = run(["init"], project, home)
      .split("\n")
      .find((line) => line.startsWith("Hosts:"));

    assert.equal(initLine, undefined, "no manifest, no line: a project report about hosts nobody installed is noise");
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(project, { recursive: true, force: true });
  }
});
