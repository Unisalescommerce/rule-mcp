/**
 * @module core/release/detect
 *
 * What release tooling a project already has.
 *
 * `/rule-init` reports this rather than installing anything: a changelog
 * generator, a version script and a release workflow are the project's choice,
 * and the honest first step is to say whether one is already there. It reads
 * files only - nothing is written and no dependency is added.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * @typedef {object} ReleaseTooling
 * @property {boolean} changelog a CHANGELOG.md exists
 * @property {boolean} changelogScript a `changelog` package script exists
 * @property {boolean} versionScript a `version` package script exists
 * @property {boolean} releaseWorkflow a `.github/workflows/release*.yml` exists
 * @property {boolean} packageVersioning package.json declares a version
 * @property {boolean} pyproject a pyproject.toml exists
 * @property {boolean} pythonBuildSystem pyproject.toml declares [build-system]
 * @property {boolean} uvLock a uv.lock exists
 * @property {boolean} cargoManifest a Cargo.toml exists
 * @property {boolean} cargoLock a Cargo.lock exists
 */

/**
 * Detect the release tooling a project already has.
 *
 * @param {string} projectDir
 * @returns {ReleaseTooling}
 */
export function detectReleaseTooling(projectDir) {
  let manifest = null;

  try {
    manifest = JSON.parse(readFileSync(join(projectDir, "package.json"), "utf8"));
  } catch {
    // No package.json is a fact, not a failure: a non-Node project still gets a
    // verdict, one with no package-manager release tooling.
  }

  // A Python project answers the same question with different files, and the
  // honest report is the same shape: what is there, without installing anything.
  let pyproject = "";

  try {
    pyproject = readFileSync(join(projectDir, "pyproject.toml"), "utf8");
  } catch {
    // No pyproject.toml is a fact too: the Python fields stay false.
  }

  const scripts = manifest?.scripts ?? {};
  let workflows;

  try {
    workflows = readdirSync(join(projectDir, ".github", "workflows"));
  } catch {
    workflows = [];
  }

  return {
    changelog: existsSync(join(projectDir, "CHANGELOG.md")),
    changelogScript: Boolean(scripts.changelog),
    versionScript: Boolean(scripts.version),
    releaseWorkflow: workflows.some((name) => /^release.*\.ya?ml$/u.test(name)),
    packageVersioning: typeof manifest?.version === "string",
    pyproject: pyproject !== "",
    pythonBuildSystem: /^\[build-system\]/mu.test(pyproject),
    uvLock: existsSync(join(projectDir, "uv.lock")),
    cargoManifest: existsSync(join(projectDir, "Cargo.toml")),
    cargoLock: existsSync(join(projectDir, "Cargo.lock")),
  };
}

/** The name a reader recognizes for the fields whose key is not one. */
const LABELS = {
  pyproject: "pyproject.toml",
  pythonBuildSystem: "[build-system]",
  uvLock: "uv.lock",
  cargoManifest: "Cargo.toml",
  cargoLock: "Cargo.lock",
};

/**
 * The tooling that was found, as labels, for a one-line report.
 *
 * @param {ReleaseTooling} tooling
 * @returns {string[]}
 */
export function releaseToolingLabels(tooling) {
  return Object.entries(tooling)
    .filter(([, present]) => present)
    .map(([name]) => LABELS[name] ?? name);
}
