/** Install and uninstall commands (agent catalog + service). */

import { entrypoint, print, printJson } from "./_shared.js";
import { applySurfaceEnv, surfaceOf } from "../install/_surface-flags.js";
import { applyMinimalEnv } from "../setup/_options.js";
import { formatInstallResult, formatUninstallResult } from "../_tui-formats.js";
import { installAgent } from "../install/index.js";
import { levelSupport } from "../installers/hosts/index.js";
import { uninstallFromAgent } from "../_uninstall.js";
import { forgetInstall, readManifest, recordInstall } from "../install/_manifest.js";
import { getRuntimePaths } from "../paths/index.js";
import { rmSync } from "node:fs";
import { join } from "node:path";
/**
 * The level a caller asked for, checked against every selected host's ceiling.
 *
 * `all` is not refused for asking for more than some hosts can do: the level is a
 * cap, and a host that cannot reach it installs what it supports. A named host is
 * refused, because there the caller asked a question with one answer.
 *
 * @param {{ agent: string, level?: string }} opts
 * @returns {{ ok: boolean, refusals: Array<{ id: string, ceiling: string, missing: Array<{ rung: string, reason: string }> }>, hooks: boolean }}
 */
function checkLevel(opts) {
  const harnessHooks = opts.hooks === true;

  if (!opts.level) {
    return { ok: true, refusals: [], hooks: harnessHooks };
  }

  const targets = opts.agent === "all" ? [] : [opts.agent];
  const refusals = targets
    .map((agent) => levelSupport(agent, opts.level))
    .filter((support) => support && !support.allowed)
    .map((support) => ({ id: support.id, ceiling: support.ceiling, missing: support.missing }));

  return { ok: refusals.length === 0, refusals, hooks: harnessHooks && Number(String(opts.level).replace(/^L/u, "")) >= 3 };
}

function installCommand(opts) {
  const level = checkLevel(opts);

  if (!level.ok) {
    for (const refusal of level.refusals) {
      process.stderr.write(`install: ${refusal.id} reaches ${refusal.ceiling}, not ${opts.level}\n`);

      for (const gap of refusal.missing) {
        process.stderr.write(`  ${gap.rung}: ${gap.reason}\n`);
      }
    }

    process.exitCode = 1;

    return;
  }

  // The narrow path owns no plan, but both answers still have to land: same
  // mirror the plan tasks use (see cli/installers/_env.js).
  const surface = typeof opts.surface === "string" ? surfaceOf({ surface: opts.surface }) : (opts.surface ?? null);
  applyMinimalEnv(surface ? undefined : opts.minimal);
  applySurfaceEnv(surface);

  let result;

  try {
    result = installAgent({
      agent: opts.agent,
      force: opts.force,
      dryRun: opts.dryRun,
      global: opts.global,
      mode: opts.mode,
      entrypoint,
      hooks: level.hooks,
      level: opts.level ?? null,
    });
  } catch (error) {
    // A refusal is an answer, not a crash: the reader gets the sentence the
    // installer wrote - which names the reason - and a stack trace helps nobody.
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;

    return;
  }
  if (opts.json) {
    printJson(result);
  } else {
    print(formatInstallResult(result));
  }

  if (result.ok && !opts.dryRun) {
    recordInstall({ agent: opts.agent, mode: opts.mode ?? "stdio", dryRun: opts.dryRun });
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

/**
 * Uninstall rule-mcp from an agent/IDE.
 * Removes the rule-mcp entry from the agent config file.
 *
 * @param {{ agent: string, dryRun: boolean }} opts
 */
function uninstallCommand(opts) {
  // "all" answers what this machine recorded, so an uninstall never relies on
  // re-detecting an agent whose config an earlier release already removed.
  const recorded = readManifest().agents;
  const targets = opts.agent === "all" && recorded.length > 0 ? recorded : [opts.agent];
  const results = targets.map((agent) => uninstallFromAgent({ agent, dryRun: opts.dryRun }));
  const result = {
    ok: results.every((entry) => entry.ok),
    dryRun: opts.dryRun,
    note: `Removed rule-mcp from ${targets.join(", ")}.`,
    agents: results.flatMap((entry) => entry.agents),
    uninstalled: Object.assign({}, ...results.map((entry) => entry.uninstalled)),
  };

  if (result.ok && !opts.dryRun) {
    for (const agent of result.agents) {
      forgetInstall({ agent, dryRun: opts.dryRun });
    }

    if (opts.purge) {
      const home = getRuntimePaths().homeDir;

      if (opts.keepConfig) {
        for (const dir of ["projects", "state", "data"]) {
          rmSync(join(home, dir), { recursive: true, force: true });
        }
      } else {
        rmSync(home, { recursive: true, force: true });
      }
    }
  }

  if (opts.json) {
    printJson(result);
  } else {
    print(formatUninstallResult(result));
  }
}

/**
 * List or call MCP tools directly.
 *
 * @param {{ subcommand: string, toolName?: string, json?: string }} opts
 */

export { installCommand, uninstallCommand };
