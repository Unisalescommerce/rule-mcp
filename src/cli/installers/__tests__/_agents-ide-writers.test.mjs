/** The emacs, generic and devin installers writing into a sandboxed home. */
import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const home = mkdtempSync(join(tmpdir(), "rule-mcp-ide-writers-"));
process.env.HOME = home;

const { createGenericInstaller, installDevin, installEmacs } = await import("../_agents-ide.js");

const ENTRY = "/tmp/fake-rule-mcp.js";

test.after(() => rmSync(home, { recursive: true, force: true }));

test("installEmacs appends its block once and leaves an existing block alone", () => {
  const initFile = join(home, ".emacs.d", "init.el");

  installEmacs({ entrypoint: ENTRY, dryRun: false, global: false });
  const written = readFileSync(initFile, "utf8");
  assert.match(written, /;; rule-mcp/, "the emacs block is appended");

  installEmacs({ entrypoint: ENTRY, dryRun: false, global: false });
  assert.equal(readFileSync(initFile, "utf8"), written, "a second install does not duplicate the block");
});

test("a generic installer writes the documented file and nothing beside it", () => {
  const results = createGenericInstaller("cline")({ entrypoint: ENTRY, dryRun: false, global: false });

  assert.equal(results.length, 1, "one file per host");
  assert.ok(existsSync(join(home, ".cline", "data", "settings", "cline_mcp_settings.json")), "the documented path, not .config/<name>/mcp.json");
  assert.equal(existsSync(join(home, ".config", "cline")), false, "no instructions file where no host documents one");
  assert.doesNotMatch(readFileSync(join(home, ".cline", "data", "settings", "cline_mcp_settings.json"), "utf8"), /instructions\.md/u, "and nothing points at one");
});

test("installDevin writes the config and one file per slash command", () => {
  const results = installDevin({ entrypoint: ENTRY, dryRun: false, global: false });
  assert.ok(existsSync(join(home, ".config", "devin", "mcp_config.json")), "the devin config lands");
  assert.ok(results.length > 1, "the slash-command files are written too");
});
