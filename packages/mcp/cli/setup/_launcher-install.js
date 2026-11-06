/**
@module cli/setup/launcher-install
 *
 * Install the tool outside any working tree: one copy per version under
 * `~/.rule-mcp/launcher/<version>/`, and a pointer naming the one in use.
 *
 * A launcher that names a path into a checkout inherits that checkout's branch.
 * When the branch has no entry point node exits 1, which reads exactly like "the
 * validator found violations", so a gate that was skipped looks like a decision.
 * A copy has no branch.
 *
 * The copy is `pnpm deploy --prod --legacy`, not `pnpm pack`: a tarball carries
 * 1.2 MB packed and 6.8 MB extracted with no `node_modules`, so the copy cannot
 * start (`commander` is missing) and OpenTUI's platform binary is absent, which
 * costs the terminal UI too. The deploy carries 85 MB with the dependency tree
 * materialized, platform binary included, and answers `--version` offline. A copy
 * that cannot run is not a copy.
 *
 * @see docs/plans/_stable-launcher-outside-the-checkout.md - Phase 1, and the measurement
 */

import { existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { currentVersion, installedVersions, launcherRoot, recordVersion, setCurrent } from "./_launcher-store.js";
import { pruneVersions, recordPrune } from "./_launcher-prune.js";
import { deployCopy } from "./_launcher-deploy.js";

export { currentVersion, installedVersions, launcherRoot, setCurrent } from "./_launcher-store.js";
export { deployArgs, deployCopy } from "./_launcher-deploy.js";

/**
 * Whether a copy answers `--version`.
 *
 * The same probe the shim uses: a launcher that cannot start is not a launcher,
 * and exit 127 is the only code that means "cannot execute".
 *
 * @param {{ dir: string, run?: Function }} options
 * @returns {{ ok: boolean, version?: string }}
 */
export function probeCopy({ dir, run = (command, args, options) => ({ stdout: execFileSync(command, args, options) }) }) {
  const entry = join(dir, "bin", "rule-mcp.js");

  if (!existsSync(entry)) {
    return { ok: false };
  }

  try {
    const { stdout } = run(process.execPath, [entry, "--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

    return { ok: true, version: String(stdout).trim() };
  } catch {
    return { ok: false };
  }
}

/**
 * Install one version, point the launcher at it, and prune the copy it replaced.
 *
 * @param {{ checkout: string, version: string, root?: string, run?: Function, now?: Function, dryRun?: boolean, probe?: Function }} options
 * @returns {{ status: "installed"|"verified"|"planned"|"failed", dir: string, version: string, pruned?: string[], reason?: string }}
 */
export function installLauncher({ checkout, version, root, run, now = () => new Date().toISOString().slice(0, 10), dryRun = false, probe }) {
  const dir = join(launcherRoot({ root }), version);

  if (dryRun) {
    return { status: "planned", dir, version };
  }

  // A copy this record already names, and that still answers, is the state the
  // caller wanted: deploying it again would rewrite 85 MB for nothing.
  const known = installedVersions({ root }).find((row) => row.version === version);

  if (known && existsSync(dir) && currentVersion({ root }) === version) {
    return { status: "verified", dir, version };
  }

  try {
    deployCopy({ checkout, target: dir, run });
  } catch (error) {
    return { status: "failed", dir, version, reason: String(error?.message ?? error).split("\n", 1)[0] };
  }

  const check = (probe ?? probeCopy)({ dir });

  if (check?.ok === false) {
    return { status: "failed", dir, version, reason: "the copy does not answer --version" };
  }

  recordVersion({ root, row: { version, source: checkout, installedAt: now() } });
  setCurrent({ root, version });

  // One copy kept: the copy it replaced is the second thing to trust on the
  // machine and the second thing to get out of date, for no gain.
  const pruned = pruneVersions({ root, keep: [version] });

  recordPrune({ root, keep: [version] });

  return { status: "installed", dir, version, pruned };
}

/**
 * Remove every installed copy under `launcher/`, including the pointer and record.
 *
 * Callers that also remove the PATH shim must run this first: a shim that still
 * names a deleted copy is the checkout incident in reverse.
 *
 * @param {{ root?: string, dryRun?: boolean }} [options]
 * @returns {{ status: "removed"|"planned"|"absent", dir: string, lines: string[] }}
 */
export function removeLauncher({ root, dryRun = false } = {}) {
  const dir = launcherRoot({ root });

  if (!existsSync(dir)) {
    return { status: "absent", dir, lines: [] };
  }

  if (dryRun) {
    return { status: "planned", dir, lines: [`would remove ${dir}`] };
  }

  rmSync(dir, { recursive: true, force: true });

  return { status: "removed", dir, lines: [`removed ${dir}`] };
}
