/**
@module cli/setup/launcher-live
 *
 * Which target the launcher would run right now, and since when.
 *
 * "Which binary am I talking to" is the question the incident produced: the
 * launcher answered with a stack trace, and nothing on the machine could say
 * whether the tool was the copy, the checkout, or neither.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

import { getRuntimePaths } from "../paths/index.js";
import { currentVersion, installedVersions, launcherRoot } from "./_launcher-install.js";
import { ownEntrypoint } from "./_shim.js";

/**
 * The live target, as a doctor row.
 *
 * @param {{ root?: string, checkout?: string }} [options]
 * @returns {{ kind: "copy"|"checkout"|"none", version?: string, installedAt?: string, path?: string, label: string }}
 */
export function liveLauncher({ root = getRuntimePaths().homeDir, checkout = ownEntrypoint() } = {}) {
  const version = currentVersion({ root });
  const copy = version ? join(launcherRoot({ root }), version, "bin", "rule-mcp.js") : undefined;

  if (copy && existsSync(copy)) {
    const installedAt = installedVersions({ root }).find((row) => row.version === version)?.installedAt;

    return { kind: "copy", version, installedAt, path: copy, label: `copy ${version}${installedAt ? ` (installed ${installedAt})` : ""}` };
  }

  if (checkout && existsSync(checkout)) {
    return { kind: "checkout", path: checkout, label: `checkout ${checkout}` };
  }

  return { kind: "none", label: "none - run `rule-mcp setup`" };
}
