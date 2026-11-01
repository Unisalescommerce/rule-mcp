/** Scratch projects the project-check tests read from. */

import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** A project with one function nobody exports, calls or tests. */
export const deadProject = () => {
  const root = mkdtempSync(join(tmpdir(), "rule-checks-dead-"));

  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src", "dead.js"), ["function orphan() {", "  return 1;", "}", ""].join("\n"));

  return root;
};
