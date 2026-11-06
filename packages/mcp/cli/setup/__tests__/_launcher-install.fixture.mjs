/**
 * A throwaway runtime home and a runner that fakes the deploy.
 *
 * The deploy itself is measured money: 85 MB written per call. These helpers let
 * the launcher tests assert the layout, the pointer, the record and the command
 * line without writing any of it.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** A temporary home, the runtime root inside it, and its cleanup. */
export function launcherSandbox() {
  const home = mkdtempSync(join(tmpdir(), "rule-launcher-"));

  return { home, root: join(home, ".rule-mcp"), cleanup: () => rmSync(home, { recursive: true, force: true }) };
}

/**
 * A runner that records the command and writes the entry point the deploy would.
 *
 * @param {string} home - the sandbox home, so a target outside it is not written
 */
export function fakeRunner(home) {
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
