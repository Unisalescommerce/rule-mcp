/**
 * @module test/installers/host-uninstall-paths
 *
 * The parity rule Phase 3 exists to enforce: an uninstaller does not know where a
 * host keeps its config, it asks the host record.
 *
 * The bug this catches is the one that was there - `droid` written to
 * `~/.factory/mcp.json` and removed from `~/.config/droid/mcp.json`, `neovim`
 * "removed" from a file no installer ever wrote - and it catches it statically,
 * because both halves happening to agree is not the property. The property is
 * that there is one place to change.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { allAgents } from "../../src/cli/installers/index.js";
import { hostRecord } from "../../src/cli/installers/hosts/index.js";

const SOURCES = ["../../src/cli/installers/_uninstall.js", "../../src/cli/installers/_uninstall-clis.js", "../../src/cli/installers/_agents-opencode.js"];

/**
 * A hand-built absolute path to a user-level server config file: `join(HOME,
 * ...)` or `join(homedir(), ...)` that ends in one of the file names a host uses.
 *
 * Two things are deliberately outside it, each with an owner elsewhere:
 *
 * - a bare `join(<variantDir>, "mcp.json")` - VS Code Insiders and Code-OSS are
 *   the same host under another profile directory, and the record owns the
 *   directory, not the file name;
 * - a `join(process.cwd(), ...)` path - the record is user-level, and the
 *   project-scope table belongs to step 8 of the port plan, which wrote it and
 *   closed into ADR 198.
 */
const HAND_BUILT_SERVER_PATH =
  /join\(\s*(?:HOME|homedir\(\))[^)]*["'`](?:\.claude\.json|config\.toml|settings\.json|mcp-config\.json|opencode\.json|mcp_config\.json|mcp\.json)["'`]/u;

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

test("no uninstaller names a server config file as a literal", () => {
  const offenders = [];

  for (const path of SOURCES) {
    for (const line of read(path).split("\n")) {
      if (HAND_BUILT_SERVER_PATH.test(line) && !line.trimStart().startsWith("*") && !line.trimStart().startsWith("//")) {
        offenders.push(`${path.split("/").at(-1)}: ${line.trim()}`);
      }
    }
  }

  assert.deepEqual(offenders, [], "a path literal here is a second opinion about where a host keeps its server");
});

test("every host record answers the file an uninstall has to clean", () => {
  for (const id of allAgents) {
    const record = hostRecord(id);

    assert.ok(record.server.file.startsWith("/"), `${id}: the record answers a path an uninstall can open`);
    assert.equal(record.server.file, hostRecord(id).server.file, `${id}: the answer is stable within a run`);
  }
});

test("a host that moved lists the old paths, so an old install is still reachable", () => {
  const moved = allAgents.filter((id) => hostRecord(id).legacy.length > 0).sort();

  assert.deepEqual(moved, ["antigravity", "cline", "copilot", "droid", "grok", "kilo", "kimi", "kiro", "qwen", "vibe", "zed"], "the hosts an earlier release wrote somewhere else");
});
