/**
 * The first release forces the version the manifests already carry, so an
 * apply with nothing to change must succeed and write nothing. It runs before
 * the release commit, and a non-zero exit there reports a failed release after
 * the push went through.
 */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("../../../../", import.meta.url));

/** A tree that holds only what the version script reads. */
function tree(version) {
  const root = mkdtempSync(join(tmpdir(), "rule-mcp-version-apply-"));

  for (const directory of ["scripts/build", "packages/mcp/core/commit"]) {
    mkdirSync(join(root, directory, ".."), { recursive: true });
    cpSync(join(repository, directory), join(root, directory), { recursive: true });
  }

  writeFileSync(join(root, "package.json"), `{\n  "version": "${version}"\n}\n`);
  writeFileSync(join(root, "server.json"), `{\n  "version": "${version}",\n  "packages": [{ "version": "${version}" }]\n}\n`);
  writeFileSync(join(root, "CHANGELOG.md"), `# Changelog\n\n## [${version}]\n\n- entry\n`);

  return root;
}

test("an apply of the version already in place writes nothing and exits 0", () => {
  const root = tree("0.1.0");
  const before = readFileSync(join(root, "CHANGELOG.md"), "utf8");

  try {
    const run = spawnSync(process.execPath, [join(root, "scripts/build/version/index.mjs"), "--apply", "0.1.0"], { encoding: "utf8" });

    assert.equal(run.status, 0, run.stderr);
    assert.equal(readFileSync(join(root, "CHANGELOG.md"), "utf8"), before, "no second heading");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
