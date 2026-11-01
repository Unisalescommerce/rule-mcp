/**
@module cli/setup/task-launcher
 *
 * The install step that puts a copy of the tool under the runtime root, so a
 * launcher does not depend on which branch a checkout is on.
 *
 * The step reports the size it wrote, because the copy is 85 MB and that is a
 * number a user is entitled to see before it is on their disk a second time.
 */

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { pkg } from "../paths/index.js";
import { currentVersion, installLauncher, launcherRoot, removeLauncher } from "./_launcher-install.js";

/**
 * How much disk a directory occupies, in bytes.
 *
 * @param {string} dir
 * @returns {number}
 */
export function dirBytes(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
      const path = join(dir, entry.name);

      if (entry.isSymbolicLink()) {
        return total;
      }

      return total + (entry.isDirectory() ? dirBytes(path) : statSync(path).size);
    }, 0);
  } catch {
    return 0;
  }
}

/** Bytes as a short human string, the way `du -h` would print them. */
export const sizeText = (bytes) => `${Math.round(bytes / 1_048_576)} MB`;

/**
 * Install the version this checkout is, and point the launcher at it.
 *
 * @param {{ checkout?: string, version?: string, run?: Function, probe?: Function }} [options]
 * @returns {object} a plan task
 */
export const launcherTask = ({ checkout = process.cwd(), version = pkg.version, run, probe } = {}) => ({
  id: "launcher",
  title: "Launcher copy",
  detail: `${launcherRoot()}/${version}`,
  run: ({ dryRun }) => {
    const result = installLauncher({ checkout, version, run, probe, dryRun });
    const pointer = currentVersion();

    if (result.status === "failed") {
      return { status: "warn", summary: result.reason ?? "deploy failed", lines: ["run `rule-mcp setup` again once pnpm works"] };
    }

    if (result.status === "planned") {
      return { status: "ok", summary: `would deploy ${version} to ${result.dir}` };
    }

    if (result.status === "verified") {
      return { status: "ok", summary: `${version} verified`, lines: [`current: ${pointer}`] };
    }

    return {
      status: "ok",
      summary: `${version} - ${sizeText(dirBytes(result.dir))}`,
      lines: [`current: ${pointer}`, ...(result.pruned.length > 0 ? [`pruned: ${result.pruned.join(", ")}`] : [])],
    };
  },
});

/**
 * Remove the installed copy before the PATH shim goes.
 *
 * @returns {object} a plan task
 */
export const launcherRemovalTask = () => ({
  id: "launcher",
  title: "Launcher copy",
  detail: launcherRoot(),
  run: ({ dryRun }) => {
    const result = removeLauncher({ dryRun });

    if (result.status === "absent") {
      return { status: "ok", summary: "nothing found" };
    }

    return {
      status: "ok",
      summary: result.status === "planned" ? "would remove" : "removed",
      lines: result.lines,
    };
  },
});
