import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

/**
 * The release pipeline must ship a verifiable artifact (OSS-11).
 *
 * The release workflow published nothing but a changelog excerpt: no
 * build, no artifact, no checksum. The project actually ships the GitHub
 * tarball, so the pipeline builds it, checksums it, installs it from
 * scratch with pnpm to prove it works, and only then attaches it - never touching
 * a registry, which is out of scope by decision.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const release = readFileSync(join(root, ".github", "workflows", "release.yml"), "utf8");

test("a build job packs the tarball and checksums it", () => {
  assert.ok(/^ {2}build:/mu.test(release), "release.yml needs a build job");
  assert.ok(release.includes("pnpm build"), "the build job packs through pnpm build");
  // shasum and sha256sum write the same manifest format; CI uses whichever
  // the runner guarantees.
  assert.ok(/shasum|sha256sum/.test(release) && release.includes("SHA256SUMS"), "the build job produces a checksum manifest");
});

test("a verify job installs the packed tarball from scratch", () => {
  assert.ok(/^ {2}verify:/mu.test(release), "release.yml needs a verify job");
  assert.ok(release.includes("download-artifact"), "verify consumes the build artifact, not the checkout");
});

test("the release job ships the build artifact, not a rebuild", () => {
  assert.ok(/^ {2}release:/mu.test(release), "release.yml needs a release job");
  assert.ok(release.includes("softprops/action-gh-release"), "the release job publishes the GitHub Release");
});

test("only the release job holds contents:write", () => {
  for (const name of ["build", "verify", "release"]) {
    const at = release.search(new RegExp(`^ {2}${name}:$`, "mu"));

    assert.ok(at !== -1, `expected a ${name} job`);

    const tail = release.slice(at);
    const next = tail.slice(1).search(/^ {2}\w/mu);
    const block = next === -1 ? tail : tail.slice(0, next + 1);
    const permissions = block.slice(0, block.indexOf("steps:"));

    if (name === "release") {
      assert.ok(/contents:\s*write/.test(permissions), "the release job needs contents:write to publish");
    } else {
      assert.ok(!/contents:\s*write/.test(permissions), `the ${name} job must not hold contents:write`);
    }
  }
});

test("the pipeline never touches a registry", () => {
  for (const needle of ["npm publish", "registry.npmjs.org", "npmjs.com"]) {
    assert.ok(!release.includes(needle), `release.yml must not reference a registry (${needle})`);
  }
});

test("the verify job builds the extracted tarball with pnpm and the workspace", () => {
  const verify = release.slice(release.search(/^ {2}verify:$/mu), release.search(/^ {2}release:$/mu));

  assert.ok(verify.includes("pnpm/action-setup"), "verify needs pnpm");
  assert.ok(verify.includes("pnpm install --frozen-lockfile"), "the lockfile builds the workspace");
  assert.ok(verify.includes("pnpm docs:build"), "the site builds from the same tree");
  assert.ok(verify.includes("node bin/rule-mcp.js --version"), "and the CLI runs");
  assert.ok(!/\bnpm install\b/u.test(verify), "no registry install");
});

test("a job that calls pnpm sets pnpm up first", () => {
  for (const name of ["build", "verify", "release"]) {
    const at = release.search(new RegExp(`^ {2}${name}:$`, "mu"));
    const rest = release.slice(at + 1);
    const end = rest.search(/^ {2}\w+:$/mu);
    const block = end === -1 ? rest : rest.slice(0, end);

    assert.ok(!/run: pnpm/u.test(block) || block.includes("pnpm/action-setup"), `the ${name} job runs pnpm with no setup step`);
  }
});

test("the release and pages builds run a Node the wizard can draw on", () => {
  const pages = readFileSync(join(root, ".github", "workflows", "pages.yml"), "utf8");

  for (const text of [release, pages]) {
    assert.ok(!/node-version: "(?:20|22|24)"/u.test(text), "both build the wizard, which needs 26.4");
  }
});

test("a release needs no signing key", () => {
  assert.ok(!release.includes("verify-tag"), "an annotated tag from pnpm release is enough");
  assert.ok(!existsSync(join(root, ".github", "release-signing-key.asc")));
});

test("the release asset is the committed tree", () => {
  const script = readFileSync(join(root, "scripts", "package.sh"), "utf8");

  assert.ok(script.includes("archive --format=tar.gz"), "a pack of one package cannot run: it has no bin, skills or lockfile");
  assert.ok(script.includes('--prefix="${NAME}-${VERSION}/"'), "the tarball extracts into one directory");
});
