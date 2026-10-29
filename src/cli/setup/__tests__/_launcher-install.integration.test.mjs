/**
@module test/setup/launcher-install-integration

The measurement Phase 1 asked for, kept as a check rather than a paragraph: a
real `pnpm deploy --prod --legacy` into a temporary home, then the copy answers
`--version`, and OpenTUI's platform binary is in it.

Opt-in (`RULE_MCP_LAUNCHER_INTEGRATION=1`) because it deploys 85 MB and needs the
package store. What it protects is the risk the plan named: an optional dependency
that is not in the copy is a launcher that cannot start.
*/

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { installLauncher, probeCopy } from "../_launcher-install.js";

const enabled = process.env.RULE_MCP_LAUNCHER_INTEGRATION === "1";

test("a deployed copy answers --version and carries the platform binary", { skip: !enabled && "set RULE_MCP_LAUNCHER_INTEGRATION=1" }, () => {
  const home = mkdtempSync(join(tmpdir(), "rule-launcher-real-"));

  try {
    const result = installLauncher({ checkout: process.cwd(), version: "0.0.0-integration", homeDir: home });

    assert.equal(result.status, "installed", `deploy failed: ${result.reason ?? ""}`);
    assert.equal(probeCopy({ dir: result.dir }).ok, true, "the copy must start on its own");

    const store = join(result.dir, "node_modules", ".pnpm");
    const platform = existsSync(store)

      ? readdirSync(store).filter((name) => name.startsWith("@opentui+core-"))
      : [];

    assert.ok(platform.length > 0, "the terminal UI's platform binary is part of the copy");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
