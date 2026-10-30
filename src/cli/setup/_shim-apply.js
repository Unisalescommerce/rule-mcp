/**
 * @module cli/setup/shim-apply
 *
 * Writing and removing the global `rule-mcp` launcher.
 *
 * The shim is a plain launcher script on purpose. `pnpm link --global`
 * rewrites pnpm-workspace.yaml (clobbering the overrides) and the lockfile
 * in pnpm 10+, which is unacceptable corruption of the repository being
 * installed from. The durable answer is a copy under `~/.rule-mcp/launcher/`
 * (see pending ADR `the-launcher-owns-a-copy-outside-the-checkout`).
 */

import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";

import { launcher as renderLauncher } from "./_launcher-script.js";
import { getRuntimePaths } from "../paths/index.js";
import { globalBinDir, linkCandidates, shimCandidates, shimPath, shimWorks, skipGlobalLink } from "./_shim.js";

/** The launcher text: a resolution script, not a path. See {@link module:cli/setup/launcher-script}. */
export { launcher } from "./_launcher-script.js";

/**
 * Make sure a working shim exists, rewriting a stale one.
 *
 * @param {{ localBin: string, dryRun?: boolean }} options
 * @returns {{ status: "verified"|"created"|"relinked"|"refreshed"|"skipped"|"unwritable"|"planned", path?: string, reason?: string }}
 */
export function ensureGlobalShim({ localBin, dryRun = false }) {
  const expected = renderLauncher(localBin, { root: getRuntimePaths().homeDir });
  const current = readableShim();
  const works = shimWorks();

  // A shim that runs is not the same as a shim that is current: the body gained
  // a target check that turns a moved entry point into exit 127, and a launcher
  // written before it would keep reporting a stack trace. Compare the text.
  if (works && current === expected) {
    return { status: "verified", path: shimPath() };
  }

  const stale = shimPath();
  // Two ways a shim is out of date, and a caller can act on the difference: one
  // did not launch this checkout at all ("relinked"), the other launched it with
  // a body that predates the target check ("refreshed").
  const refresh = works && stale !== "" && current !== expected;

  if (skipGlobalLink()) {
    return { status: "skipped", reason: "RULE_MCP_SKIP_GLOBAL_LINK=1", path: stale || undefined };
  }

  if (dryRun) {
    return { status: "planned", path: globalBinDir() };
  }

  if (stale) {
    rmSync(stale, { force: true });
  }

  const dir = globalBinDir();

  try {
    mkdirSync(dir, { recursive: true });

    const target = `${dir}/rule-mcp`;

    writeFileSync(target, expected);
    chmodSync(target, 0o755);

    return { status: refresh ? "refreshed" : stale ? "relinked" : "created", path: target };
  } catch (error) {
    return { status: "unwritable", path: dir, reason: error.message };
  }
}

/** The current shim text, or null when there is no shim to read. */
function readableShim() {
  const path = shimPath();

  try {
    return path ? readFileSync(path, "utf8") : null;
  } catch {
    return null;
  }
}

/** Whether a path exists as a file or a dangling symlink. */
const present = (path) => {
  try {
    lstatSync(path);

    return true;
  } catch {
    return false;
  }
};

/**
 * Remove every shim and linked store entry this installer may have created.
 *
 * @param {{ dryRun?: boolean }} [options]
 * @returns {Array<{ path: string, kind: "shim"|"link", status: "removed"|"planned"|"skipped" }>}
 */
export function removeGlobalShims({ dryRun = false } = {}) {
  if (skipGlobalLink()) {
    return [{ path: "(all)", kind: "shim", status: "skipped" }];
  }

  const entries = [...shimCandidates().map((path) => ({ path, kind: "shim" })), ...linkCandidates().map((path) => ({ path, kind: "link" }))];

  return entries

    .filter((entry) => present(entry.path))

    .map((entry) => {
      if (dryRun) {
        return { ...entry, status: "planned" };
      }

      if (entry.kind === "link") {
        rmSync(entry.path, { recursive: true, force: true });
      } else {
        unlinkSync(entry.path);
      }

      return { ...entry, status: "removed" };
    });
}

/** Whether anything global is still installed, for the uninstall scan. */
export const globalShimPresent = () => shimCandidates().some((path) => existsSync(path)) || Boolean(shimPath());
