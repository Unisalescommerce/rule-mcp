/** Whether the checked-out branch is a conventional trunk. */
import { currentBranch } from "../../git/_repo.js";

/** Branches that receive numbered ADRs on landing. */
export const TRUNK_BRANCHES = new Set(["main", "master", "develop"]);

/**
 * True when HEAD is a trunk branch.
 *
 * @param {string} projectDir
 * @returns {boolean}
 */
export function onTrunk(projectDir) {
  const branch = currentBranch(projectDir);

  return Boolean(branch) && TRUNK_BRANCHES.has(branch);
}
