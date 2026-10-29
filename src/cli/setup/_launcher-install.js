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
 * @see docs/plans/stable-launcher-outside-the-checkout.md - Phase 1, and the measurement
 */

import { existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { currentVersion, installedVersions, launcherRoot, pruneVersions, recordPrune, recordVersion, setCurrent } from "./_launcher-store.js";

export { currentVersion, installedVersions, launcherRoot, setCurrent } from "./_launcher-store.js";

/** The package manager command, and why the legacy flag: pnpm 10+ needs it for a non-workspace deploy. */
const DEPLOY = ["deploy", "--prod", "--legacy"];

/**
 * Run `pnpm deploy` for one checkout into one directory.
 *
 * @param {{ checkout: string, target: string, run?: Function }} options
 * @returns {{ status: string, stdout?: string }}
 */
export function deployCopy({ checkout, target, run = defaultRun }) {
  mkdirSync(target, { recursive: true });
  const result = run("pnpm", [...DEPLOY, target], { cwd: checkout, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

  return { status: "deployed", stdout: result?.stdout };
}

/** The default runner: an argument array, never a shell string. */
function defaultRun(command, args, options = {}) {
  return { stdout: execFileSync(command, args, options) };
}

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
 * @param {{ checkout: string, version: string, homeDir?: string, run?: Function, now?: Function, dryRun?: boolean, probe?: Function }} options
 * @returns {{ status: "installed"|"verified"|"planned"|"failed", dir: string, version: string, pruned?: string[], reason?: string }}
 */
export function installLauncher({ checkout, version, homeDir, run, now = () => new Date().toISOString().slice(0, 10), dryRun = false, probe }) {
  const root = launcherRoot({ homeDir });
  const dir = join(root, version);

  if (dryRun) {
    return { status: "planned", dir, version };
  }

  // A copy this record already names, and that still answers, is the state the
  // caller wanted: deploying it again would rewrite 85 MB for nothing.
  const known = installedVersions({ homeDir }).find((row) => row.version === version);

  if (known && existsSync(dir) && currentVersion({ homeDir }) === version) {
    return { status: "verified", dir, version };
  }

  try {
    deployCopy({ checkout, target: dir, run });
  } catch (error) {
    return { status: "failed", dir, version, reason: String(error?.message ?? error).split("\n")[0] };
  }

  const check = (probe ?? probeCopy)({ dir });

  if (check?.ok === false) {
    return { status: "failed", dir, version, reason: "the copy does not answer --version" };
  }

  recordVersion({ homeDir, row: { version, source: checkout, installedAt: now() } });
  setCurrent({ homeDir, version });

  // One copy kept: the copy it replaced is the second thing to trust on the
  // machine and the second thing to get out of date, for no gain.
  const pruned = pruneVersions({ homeDir, keep: [version] });

  recordPrune({ homeDir, keep: [version] });

  return { status: "installed", dir, version, pruned };
}
