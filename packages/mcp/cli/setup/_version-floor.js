/**
@module cli/setup/version-floor

Whether this node can host the full-screen wizard.

Four reasons it cannot, and each one is a real install someone runs: a node older
than the renderer, a pipe on either end, a CI job, and a terminal that declares
itself dumb. Kept beside the options so the answer is testable without running an
install.
*/

import { WIZARD_FLOOR } from "rule-mcp-shared";

/** The oldest node that can mount the renderer. The minor matters: 26.0 exists and cannot. */
export const WIZARD_NODE_MIN = WIZARD_FLOOR;

/** A version string as comparable numbers. */
export const versionParts = (version = process.version) =>
  String(version)
    .replace(/^v/u, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

/**
Whether `version` reaches `floor`.

The minor matters: node 26.0 exists and cannot load the renderer, so a
major-only comparison would hand it a wizard that fails on mount.

@param {string} version
@param {string} floor
@returns {boolean}
*/
export function atLeast(version, floor) {
  const left = versionParts(version);
  const right = versionParts(floor);

  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;

    if (a !== b) {
      return a > b;
    }
  }

  return true;
}

/**
Whether this process can host a full-screen wizard.

@param {object} [env] @param {object} [stdin] @param {object} [stdout] @param {string} [version]
*/
export function canRenderWizard(env = process.env, stdin = process.stdin, stdout = process.stdout, version = process.version) {
  if (!atLeast(version, WIZARD_NODE_MIN)) {
    return false;
  }

  return Boolean(stdin.isTTY && stdout.isTTY) && !env.CI && env.TERM !== "dumb";
}

/** Why the wizard is not drawing, when the reason is the runtime. */
export const wizardRuntimeNote = () =>
  atLeast(process.version, WIZARD_NODE_MIN) ? "" : `${process.version} cannot host the wizard (node ${WIZARD_NODE_MIN} or newer draws it) - running the same plan from the flags.`;
