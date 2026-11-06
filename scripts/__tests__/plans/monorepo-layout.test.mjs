/**
 * WS1 layout contract for docs/plans/_scripts-mcp-layout.md.
 *
 * Layout contract for the pnpm workspace (WS1–WS6).
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { getRepoRoot } from "../../../packages/mcp/cli/paths/_repo.js";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const LEGACY_ALIAS = ["@", "src", "/"].join("");
const NEXT_ALIAS = ["@", "mcp", "/"].join("");

function readJson(relative) {
  return JSON.parse(readFileSync(join(ROOT, relative), "utf8"));
}

test("root package.json is the private workspace facade", () => {
  const pkg = readJson("package.json");

  assert.equal(pkg.name, "rule-mcp-workspace");
  assert.equal(pkg.private, true);
});

test("packages/{mcp,shared,docs} use the fixed package names", () => {
  const expected = {
    mcp: "rule-mcp",
    shared: "rule-mcp-shared",
    docs: "rule-mcp-docs",
  };

  for (const [dir, name] of Object.entries(expected)) {
    const pkg = readJson(`packages/${dir}/package.json`);

    assert.equal(pkg.name, name, `packages/${dir} must be named ${name}`);
  }
});

test("pnpm-workspace.yaml lists packages/* and nothing outside the checkout", () => {
  const yaml = readFileSync(join(ROOT, "pnpm-workspace.yaml"), "utf8");
  const members = [...yaml.matchAll(/^\s*-\s*["']?([^"'\s]+)["']?\s*$/gm)].map((match) => match[1]);
  const outside = members.filter((member) => member.startsWith(".."));

  assert.match(yaml, /^\s*-\s*["']?packages\/\*["']?\s*$/m);
  assert.deepEqual(outside, [], "a workspace member outside the checkout breaks a plain clone");
});

test("legacy layout roots are gone", () => {
  for (const relative of ["src", "tests", "case-studies", "scripts/docs-site"]) {
    assert.equal(existsSync(join(ROOT, relative)), false, `${relative}/ must not remain at the repo root`);
  }
});

test("getRepoRoot resolves the git workspace root", () => {
  const root = getRepoRoot();

  assert.equal(existsSync(join(root, "skills")), true, "skills/ marks the product root");
  assert.equal(existsSync(join(root, ".git")) || existsSync(join(root, "pnpm-workspace.yaml")), true, "root carries .git or the workspace file");
});

test("alias hook serves packages/mcp under the mcp prefix and the tree has no legacy alias imports", () => {
  const hook = readFileSync(join(ROOT, "scripts/alias-hook.mjs"), "utf8");

  assert.match(hook, new RegExp(`const PREFIX = "${NEXT_ALIAS.replaceAll("/", String.raw`\/`)}"`));
  assert.match(hook, /packages\/mcp\//);

  const offenders = [];
  const skipDirs = new Set(["node_modules", ".git", "site-dist", "coverage", ".tokensave"]);

  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skipDirs.has(entry.name)) {
        continue;
      }

      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full);
        continue;
      }

      if (!/\.(mjs|js|cjs|ts|tsx)$/.test(entry.name)) {
        continue;
      }

      const text = readFileSync(full, "utf8");

      if (text.includes(LEGACY_ALIAS)) {
        offenders.push(full.slice(ROOT.length + 1));
      }
    }
  };

  walk(ROOT);
  assert.deepEqual(offenders, [], `zero ${LEGACY_ALIAS} imports; found ${offenders.slice(0, 10).join(", ")}`);
});
