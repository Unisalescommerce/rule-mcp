/**
 * @module cli/setup/shim-store
 *
 * The entries `pnpm install -g .` leaves in pnpm's per-user global store, so the
 * uninstall can take them with it.
 *
 * pnpm keeps one project directory per install, named by a hash; the symlink
 * inside it is named after the dependency. A sweep that looks for the package one
 * level higher finds nothing and reports a clean machine while the bin `rule-mcp`
 * stays claimed, which is how the next `pnpm install -g .` dies on
 * ERR_PNPM_GLOBAL_BIN_CONFLICT.
 */

import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, sep } from "node:path";

/**
 * The package names the global store may hold this tool under.
 *
 * The current name leads, the retired one follows: a block linked under either
 * claims the same bin `rule-mcp`, so the uninstall drops both.
 */
const LINK_PACKAGES = ["rule-mcp-workspace", "rule-mcp"];

/** Linked package entries inside pnpm's per-user global store. */
export function linkCandidates(home = homedir()) {
  return (
    globalStoreRoots(home)
      .filter((root) => existsSync(root))
      .flatMap((root) => readdirs(root))
      // Two layouts, one sweep: pnpm 5/6 wrote `<layout>/node_modules/<pkg>`,
      // pnpm 10+ writes `<layout>/<hash>/node_modules/<pkg>`.
      .flatMap((layout) => [layout, ...readdirs(layout)])
      .flatMap((dir) => LINK_PACKAGES.map((name) => join(dir, "node_modules", name)))
  );
}

/**
 * Every place pnpm may keep a global store for this home.
 *
 * `PNPM_HOME` relocates the store, and on macOS it is often `~/Library/pnpm/bin`,
 * one level below the directory pnpm's own default would suggest. A value that
 * points outside the home it was given is another machine's store as far as a
 * sandbox is concerned: an uninstall would then sweep real paths.
 *
 * @param {string} home
 * @returns {string[]}
 */
function globalStoreRoots(home) {
  const inside = (dir) => dir === home || dir.startsWith(`${home}${sep}`);
  const pnpmHome = process.env.PNPM_HOME;
  const fromEnv = pnpmHome && (inside(pnpmHome) || home === homedir()) ? [join(pnpmHome, "global")] : [];

  return [
    ...new Set([
      ...fromEnv,
      join(home, "Library", "pnpm", "bin", "global"),
      join(home, "Library", "pnpm", "global"),
      join(home, ".local", "share", "pnpm", "global"),
      join(home, ".pnpm-global", "global"),
    ]),
  ];
}

/** The directories directly under a path; empty when it cannot be read. */
function readdirs(path) {
  try {
    return readdirSync(path, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(path, entry.name));
  } catch {
    return [];
  }
}
