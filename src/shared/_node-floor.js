/**
 * @module shared/node-floor
 *
 * The Node version this server runs on, and the one check that fails closed.
 *
 * The floor lives here rather than in `package.json`'s `engines`, which a
 * package manager reads as a vote on whether an install may proceed - the same
 * veto `pkg-no-engines` forbids for the projects this server generates, and this
 * repository holds itself to its own rules (ADR 109). Three readers carry it
 * instead: the installer's preflight, the doctor, and the server at start.
 */

/** The lowest Node this server runs on. OpenTUI's native core needs 26.4. */
export const NODE_FLOOR = "26.4.0";

/** A version string split into comparable numbers, `v` prefix and suffix dropped. */
const parts = (version) =>
  String(version)
    .replace(/^v/u, "")
    .split("-", 1)[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

/**
 * Whether a version is at or above the floor.
 *
 * @param {string} version - for example `process.version`
 * @param {string} [floor]
 * @returns {boolean}
 */
export function nodeAtLeast(version, floor = NODE_FLOOR) {
  const [major, minor, patch] = parts(version);
  const [floorMajor, floorMinor, floorPatch] = parts(floor);

  if (major !== floorMajor) {
    return major > floorMajor;
  }

  if (minor !== floorMinor) {
    return minor > floorMinor;
  }

  return patch >= floorPatch;
}

/**
 * Refuse to start below the floor.
 *
 * The failure this prevents is the one nobody can read: OpenTUI's native core
 * throws from inside a `.node` binary, and the stack says nothing about Node.
 */
export function assertNodeFloor() {
  if (nodeAtLeast(process.version)) {
    return;
  }

  process.stderr.write(`rule-mcp needs Node ${NODE_FLOOR} or newer; this is ${process.version}.\n`);
  process.exit(1);
}
