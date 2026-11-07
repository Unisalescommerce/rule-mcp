/**
 * @module packages/docs/assets
 *
 * The files every emitted page loads: one stylesheet, one script, and the
 * brand marks. They are copied rather than bundled, so a page needs no build
 * step to run and the served bytes are the reviewed bytes.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ASSETS = ["style.css", "prefs.js"];

/** The canonical marks, from the brand kit: header, hero, favicon. */
const MARKS = ["color-mark.png", "primary-icon.png", "monochrome-mark.png"];

/**
 * @param {string} outDir
 * @param {string} projectDir
 */
export function copyAssets(outDir, projectDir) {
  const siteDir = join(projectDir, "packages", "docs");
  const marks = join(outDir, "assets");

  for (const asset of ASSETS) {
    writeFileSync(join(outDir, asset), readFileSync(join(siteDir, asset), "utf8"));
  }

  mkdirSync(marks, { recursive: true });

  for (const mark of MARKS) {
    writeFileSync(join(marks, mark), readFileSync(join(siteDir, "assets", mark)));
  }
}
