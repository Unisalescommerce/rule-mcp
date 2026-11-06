/**
@module cli/setup/launcher-deploy
 *
 * The one command that produces a runnable copy of this tool outside its
 * checkout.
 *
 * `pnpm deploy`, not `pnpm pack`: a tarball carries 1.2 MB packed and 6.8 MB
 * extracted with no `node_modules`, so the copy cannot start (`commander` is
 * missing) and OpenTUI's platform binary is absent, which costs the terminal UI
 * too. The deploy carries 85 MB with the dependency tree materialized, platform
 * binary included, and answers `--version` offline. A copy that cannot run is
 * not a copy.
 *
 * A workspace root holds more than one project, and `pnpm deploy` there answers
 * `ERR_PNPM_CANNOT_DEPLOY_MANY — Cannot deploy more than 1 project`. The filter
 * names the package that owns `bin/rule-mcp.js`, which is the one to copy.
 *
 * @see docs/plans/_stable-launcher-outside-the-checkout.md - Phase 1, and the measurement
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

/** The package manager command, and why the legacy flag: pnpm 10+ needs it for a non-workspace deploy. */
const DEPLOY = ["deploy", "--prod", "--legacy"];

/**
 * The deploy command line for one checkout.
 *
 * @param {{ checkout: string, target: string }} options
 * @returns {string[]}
 */
export function deployArgs({ checkout, target }) {
  const name = manifestName(checkout);

  return existsSync(join(checkout, "pnpm-workspace.yaml")) && name ? ["--filter", name, ...DEPLOY, target] : [...DEPLOY, target];
}

/** The name a checkout deploys under, or "" when its manifest cannot be read. */
function manifestName(checkout) {
  try {
    return String(JSON.parse(readFileSync(join(checkout, "package.json"), "utf8")).name ?? "");
  } catch {
    return "";
  }
}

/** The default runner: an argument array, never a shell string. */
function defaultRun(command, args, options = {}) {
  return { stdout: execFileSync(command, args, options) };
}

/**
 * Run `pnpm deploy` for one checkout into one directory.
 *
 * A failed deploy takes the directory it created with it: an empty
 * `launcher/<version>` is a copy the record does not name, and the next install
 * cannot tell it apart from a real one.
 *
 * @param {{ checkout: string, target: string, run?: Function }} options
 * @returns {{ status: string, stdout?: string }}
 */
export function deployCopy({ checkout, target, run = defaultRun }) {
  mkdirSync(target, { recursive: true });

  try {
    const result = run("pnpm", deployArgs({ checkout, target }), { cwd: checkout, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

    return { status: "deployed", stdout: result?.stdout };
  } catch (error) {
    rmSync(target, { recursive: true, force: true });

    throw error;
  }
}
