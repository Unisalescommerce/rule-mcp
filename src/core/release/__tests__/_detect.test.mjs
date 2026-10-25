/** WS7.1 - /rule-init reports the release tooling a project already has. */
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { detectReleaseTooling, releaseToolingLabels } from "../index.js";

test("a project with nothing reports nothing", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-release-"));
  const tooling = detectReleaseTooling(root);

  assert.deepEqual(
    tooling,
    {
      changelog: false,
      changelogScript: false,
      versionScript: false,
      releaseWorkflow: false,
      packageVersioning: false,
      pyproject: false,
      pythonBuildSystem: false,
      uvLock: false,
      cargoManifest: false,
      cargoLock: false,
    },
    "an empty directory has no release tooling",
  );
  assert.deepEqual(releaseToolingLabels(tooling), [], "and says so with no labels");
  rmSync(root, { recursive: true, force: true });
});

test("a Python project reports its own tooling, not npm's absence", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-release-"));

  mkdirSync(join(root, ".github", "workflows"), { recursive: true });
  writeFileSync(join(root, "pyproject.toml"), '[project]\nname = "hello"\nversion = "1.0.0"\n\n[build-system]\nrequires = ["hatchling"]\n');
  writeFileSync(join(root, "uv.lock"), "version = 1\n");
  writeFileSync(join(root, ".github", "workflows", "release.yml"), "name: release\n");
  const tooling = detectReleaseTooling(root);

  assert.equal(tooling.pyproject, true, "the manifest is found");
  assert.equal(tooling.pythonBuildSystem, true, "the build-system table is found");
  assert.equal(tooling.uvLock, true, "the lockfile is found");
  assert.equal(tooling.releaseWorkflow, true, "and the workflow the two of them feed");
  assert.deepEqual(
    releaseToolingLabels(tooling).sort(),
    ["pyproject.toml", "releaseWorkflow", "[build-system]", "uv.lock"].sort(),
    "the labels name the files a reader recognizes",
  );
  rmSync(root, { recursive: true, force: true });
});

test("a Rust crate reports its manifest and lockfile", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-release-"));

  writeFileSync(join(root, "Cargo.toml"), '[package]\nname = "hello"\nversion = "1.0.0"\n');
  writeFileSync(join(root, "Cargo.lock"), "version = 3\n");

  const tooling = detectReleaseTooling(root);

  assert.equal(tooling.cargoManifest, true, "the manifest is found");
  assert.equal(tooling.cargoLock, true, "the lockfile is found");
  assert.deepEqual(releaseToolingLabels(tooling).sort(), ["Cargo.lock", "Cargo.toml"], "and both are named for a reader");
  rmSync(root, { recursive: true, force: true });
});

test("a project's own release tooling is detected", () => {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-release-"));

  mkdirSync(join(root, ".github", "workflows"), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "x", version: "1.2.3", scripts: { changelog: "x", version: "y" } }));
  writeFileSync(join(root, "CHANGELOG.md"), "# Changelog\n");
  writeFileSync(join(root, ".github", "workflows", "release.yml"), "name: release\n");

  const tooling = detectReleaseTooling(root);

  assert.equal(tooling.changelog, true, "the changelog file is found");
  assert.equal(tooling.changelogScript, true, "the script is found");
  assert.equal(tooling.versionScript, true, "the version script is found");
  assert.equal(tooling.releaseWorkflow, true, "the release workflow is found");
  assert.equal(tooling.packageVersioning, true, "the package version is found");
  assert.deepEqual(
    releaseToolingLabels(tooling).sort(),
    ["changelog", "changelogScript", "packageVersioning", "releaseWorkflow", "versionScript"],
    "every found tooling is labeled",
  );
  rmSync(root, { recursive: true, force: true });
});
