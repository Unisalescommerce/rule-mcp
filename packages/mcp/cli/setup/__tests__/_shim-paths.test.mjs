/** Shim path questions that do not touch the machine: candidates and trust. */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { homedir, platform, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { globalBinDir, linkCandidates, shimCandidates, skipGlobalLink } from "../_shim.js";
import { withEnv } from "rule-mcp-shared";

test("skipGlobalLink follows the sandbox flag", () => {
  withEnv({ RULE_MCP_SKIP_GLOBAL_LINK: "1" }, () => {
    assert.equal(skipGlobalLink(), true, "the flag skips the global link");
  });
  withEnv({ RULE_MCP_SKIP_GLOBAL_LINK: undefined }, () => {
    assert.equal(skipGlobalLink(), false, "an absent flag links globally");
  });
});

test("shimCandidates sweeps every bin dir plus the retired alias", () => {
  const home = "/fake/home";
  const withoutPnpm = withEnv({ PNPM_HOME: undefined }, () => shimCandidates(home));

  assert.equal(withoutPnpm.length, 8, "four bin dirs times two names");
  assert.ok(withoutPnpm.includes(join(home, ".local", "share", "pnpm", "bin", "rule-mcp")), "the platform default bin is swept");
  assert.ok(withoutPnpm.includes(join(home, ".local", "share", "pnpm", "bin", "rule-mcpd")), "the retired -mcpd alias is swept alongside");

  const withPnpm = withEnv({ PNPM_HOME: "/fake/pnpm" }, () => shimCandidates(home));

  assert.ok(withPnpm.includes(join("/fake/pnpm", "bin", "rule-mcp")), "PNPM_HOME leads the sweep");
  assert.ok(new Set(withoutPnpm).size === withoutPnpm.length, "no duplicate paths");
});

test("globalBinDir prefers PNPM_HOME when it is set", () => {
  withEnv({ PNPM_HOME: "/fake/pnpm" }, () => {
    assert.equal(globalBinDir(), join("/fake/pnpm", "bin"), "PNPM_HOME wins outright");
  });
});

test("linkCandidates ignores missing global stores", () => {
  assert.deepEqual(linkCandidates("/fake/home-without-stores"), [], "absent stores yield no candidates");
});

test("linkCandidates sweeps both store layouts and both package names", () => {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-store-"));
  // pnpm 10+ writes one project directory per install, named by a hash; the
  // symlink inside it is named after the dependency, not after this checkout.
  const project = join(home, "Library", "pnpm", "bin", "global", "v11", "56af-18e56ecb617b80d8-0", "node_modules");
  // pnpm 5/6 wrote the package straight into the layout directory.
  const flat = join(home, "Library", "pnpm", "global", "5", "node_modules");

  mkdirSync(project, { recursive: true });
  mkdirSync(flat, { recursive: true });

  try {
    const found = linkCandidates(home);

    assert.ok(found.includes(join(project, "rule-mcp-workspace")), "the hashed per-project layout is swept");
    assert.ok(found.includes(join(project, "rule-mcp")), "and the name this package had before 2026-11-01");
    assert.ok(found.includes(join(flat, "rule-mcp-workspace")), "the flat pre-pnpm-10 layout is swept");
    assert.ok(found.includes(join(flat, "rule-mcp")), "under both names as well");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("linkCandidates only trusts a PNPM_HOME inside the home it was given", () => {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-store-"));
  const custom = join(home, "custom-pnpm", "global", "v11", "abc-0", "node_modules");

  mkdirSync(custom, { recursive: true });

  try {
    const inside = withEnv({ PNPM_HOME: join(home, "custom-pnpm") }, () => linkCandidates(home));

    assert.ok(inside.includes(join(custom, "rule-mcp-workspace")), "a PNPM_HOME under this home is swept");

    // This machine's real PNPM_HOME lives in another home as far as a sandbox
    // is concerned: reading it would make the uninstall sweep real paths.
    const outside = withEnv({ PNPM_HOME: "/fake/pnpm-elsewhere" }, () => linkCandidates(home));

    assert.ok(
      outside.every((path) => path.startsWith(home)),
      `no path outside the home: ${outside.join(", ")}`,
    );
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("globalBinDir falls back to the platform default without pnpm", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const empty = mkdtempSync(join(tmpdir(), "rule-mcp-shim-path-"));
  const expected = platform() === "darwin" ? join(homedir(), "Library", "pnpm", "bin") : join(homedir(), ".local", "share", "pnpm", "bin");

  try {
    const out = execFileSync(process.execPath, [join(here, "_shim-child.fixture.mjs")], {
      encoding: "utf8",
      env: { PATH: empty },
    });

    assert.equal(JSON.parse(out).bin, expected, "no pnpm means the platform default");
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});
