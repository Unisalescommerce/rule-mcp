/**
 * A child process with its own HOME, PATH and PNPM_HOME, and a call into the
 * shim module.
 *
 * The module reads the real PATH to find the shim, so a test that let it see this
 * machine's would depend on this machine. Every case here runs in a box instead.
 */
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export const applyModule = join(here, "..", "..", "setup", "_shim-apply.js");
export const localBin = join(here, "..", "..", "..", "..", "bin", "rule-mcp.js");

/** Whether one swept entry actually went. */
export const isRemoved = (entry) => entry.status === "removed";

/** A HOME with its own bin dir, and optionally a shim that does not launch. */
export function sandbox({ brokenShim = false } = {}) {
  const home = mkdtempSync(join(tmpdir(), "rule-mcp-shim-"));
  const bin = join(home, "bin");

  mkdirSync(bin, { recursive: true });

  if (brokenShim) {
    writeFileSync(join(bin, "rule-mcp"), "#!/bin/sh\nexit 3\n");
    chmodSync(join(bin, "rule-mcp"), 0o755);
  }

  return { home, bin };
}

/**
 * Run one call against the module in a child process, and return its JSON.
 *
 * @param {string} call - an expression over the module's exports
 * @param {{ home: string, bin: string, skip?: boolean }} env
 */
export function run(call, { home, bin, skip = false }) {
  const source = `
    const mod = await import(${JSON.stringify(applyModule)});
    const { ensureGlobalShim, globalShimPresent, removeGlobalShims } = mod;
    process.stdout.write(JSON.stringify(${call}));
  `;
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", source], {
    encoding: "utf8",
    env: {
      PATH: [bin, dirname(process.execPath), "/usr/bin", "/bin"].join(":"),
      HOME: home,
      PNPM_HOME: join(home, ".pnpm"),
      ...(skip && { RULE_MCP_SKIP_GLOBAL_LINK: "1" }),
    },
  });

  return JSON.parse(out);
}
