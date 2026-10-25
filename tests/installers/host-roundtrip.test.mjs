/**
 * @module test/installers/host-roundtrip
 *
 * Install every catalog host at its ceiling, uninstall it, and look at what is
 * left. This is Phase 2's gate, and it is the first test that treats the
 * uninstall as a promise rather than a command.
 *
 * Run in a child process on a temporary `HOME`: the installers resolve the home
 * directory when they load, which is exactly what a real install does, and it
 * keeps 23 hosts out of the current user's tree.
 *
 * The leftovers list is a ratchet. Each entry is a surface an uninstall does not
 * clean, with the phase that owns the fix; the assertion is `deepEqual`, so
 * removing one without updating the list fails here, and so does adding one.
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

/** Surfaces an uninstall leaves behind, and the phase that owes the fix. */
const LEFTOVERS = {
  // Phase 3: `installDevin` writes a skill directory per command and
  // `uninstallDevin` removes the config only.
  "~/.config/devin/skills/": "phase 3",
  // Phase 3: the cursor installer appends a rules block to `~/.cursorrules` and
  // the uninstaller has never removed it.
  "~/.cursorrules": "phase 3",
  // Phase 3: the human-readable manifest beside the JSON one, written by every
  // install and read by the doctor.
  "~/.local/share/rule-mcp/installed.md": "phase 3",
  // Phase 3: the JSON manifest. `forgetInstall` deletes it once no host is
  // recorded, but an uninstall does not call it, so the file outlives the hosts
  // it describes.
  "~/.rule-mcp/config/install.json": "phase 3",
};

/** A backup is the writer's promise, not an uninstall failure. */
const BACKUP = /\.bak$/u;

const CHILD = `
import { allAgents } from "./src/cli/installers/index.js";
import { installAgent, uninstallAgent } from "./src/cli/install/index.js";
import { hostRecord } from "./src/cli/installers/hosts/index.js";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out); else out.push(path);
  }
  return out;
};

for (const id of allAgents) {
  installAgent({ agent: id, entrypoint: "/tmp/rule-mcp.js", hooks: Number(hostRecord(id).ceiling.slice(1)) >= 3 });
}
const installed = walk(process.env.HOME).length;

for (const id of allAgents) uninstallAgent({ agent: id });

const left = walk(process.env.HOME)
  .filter((file) => { try { return readFileSync(file, "utf8").includes("rule-mcp"); } catch { return false; } })
  .map((file) => file.replace(process.env.HOME, "~"));

console.log(JSON.stringify({ installed, left }));
`;

const run = () => {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-roundtrip-"));

  try {
    const output = execFileSync(process.execPath, ["--import", ALIAS_HOOK, "--input-type=module", "--eval", CHILD], {
      cwd: ROOT,
      env: { ...process.env, HOME: home },
      encoding: "utf8",
    });

    return JSON.parse(output.trim().split("\n").at(-1));
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
};

const { installed, left } = run();

const withoutBackups = left.filter((file) => !BACKUP.test(file));
const documented = (file) => Object.keys(LEFTOVERS).some((prefix) => file.startsWith(prefix));

test("every catalog host installs, and the roundtrip starts from an empty home", () => {
  assert.ok(installed > 23, `installed ${installed} files: at least one per host`);
  assert.ok(left.length > 0, "the child reported no leftovers, which means it reported nothing");
});

test("an uninstall leaves only the surfaces this plan already owes", () => {
  assert.deepEqual(
    withoutBackups.filter((file) => !documented(file)),
    [],
    "a leftover nobody listed is a leftover nobody decided about",
  );
});

test("the leftovers list is current: nothing listed has been cleaned without updating it", () => {
  for (const prefix of Object.keys(LEFTOVERS)) {
    assert.ok(
      withoutBackups.some((file) => file.startsWith(prefix)),
      `${prefix} is listed as a leftover but the uninstall now removes it - drop the entry`,
    );
  }
});
