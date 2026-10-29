/** Install and uninstall commands (agent catalog + service). */

import { entrypoint, print, printJson } from "./_shared.js";
import { applySurfaceEnv, surfaceOf } from "../install/_surface-flags.js";
import { applyMinimalEnv } from "../setup/_options.js";
import { formatInstallResult, formatUninstallResult } from "../_tui-formats.js";
import { installAgent } from "../install/index.js";
import { checkLevel } from "./_lifecycle-install.js";
import { uninstallFromAgent } from "../_uninstall.js";
import { forgetInstall, readManifest, recordInstall } from "../install/_manifest.js";
import { reclaimConfig, reclaimTargets } from "../setup/_runtime-home.js";
import { getRuntimePaths } from "../paths/index.js";
import { rmSync } from "node:fs";
import { join } from "node:path";
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
Ask before deleting configuration. A stream nobody is reading answers no.

@param {Array<{ id: string, file: string }>} targets
@returns {Promise<boolean>}
*/
async function askReclaim(targets) {
  if (!process.stdin.isTTY) {
    return false;
  }

  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const answer = await rl.question(`\nRemove ${targets.length} configuration file(s) rule-mcp wrote: ${targets.map((target) => target.file).join(", ")}? [y/N] `);

    return /^(?:y|yes)$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

/**
Remove the configuration and records an uninstall leaves behind.

`--keep-config` keeps the switches and the legacy file - the two places a
preference lives - and still drops the records, which describe installs that
no longer exist. Everything else runs without a prompt only when the caller
is non-interactive, emits json, or a dry run.

@param {{
  dryRun?: boolean,
  keepConfig?: boolean,
  json?: boolean,
  interactive?: boolean,
  confirm?: (targets: Array<object>) => boolean|Promise<boolean>,
}} [options]
@returns {Promise<Array<{ id: string, file: string, status: string }>>}
*/
export async function reclaimConfiguration({ dryRun = false, keepConfig = false, json = false, interactive = true, confirm } = {}) {
  const present = reclaimTargets().filter((target) => target.exists);

  if (present.length === 0) {
    return [];
  }

  const switches = new Set(["env-config", "legacy-env-config"]);
  const toRemove = present.filter((target) => !(keepConfig && switches.has(target.id)));

  if (!dryRun && !json && interactive && toRemove.length > 0) {
    const approved = confirm ? await confirm(toRemove) : await askReclaim(toRemove);

    if (!approved) {
      return present.map((target) => ({ id: target.id, file: target.file, status: "kept" }));
    }
  }

  const results = reclaimConfig({ dryRun, ids: toRemove.map((target) => target.id) });
  const removed = new Map(results.map((result) => [result.id, result]));

  return present.map((target) => removed.get(target.id) ?? { id: target.id, file: target.file, status: "kept" });
}

/**
 * Uninstall rule-mcp from an agent/IDE.
 * Removes the rule-mcp entry from the agent config file.
 *
 * @param {{ agent: string, dryRun: boolean }} opts
 */
async function uninstallCommand(opts) {
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

    // The switches and the records outlive the agent configs an uninstall
    // removes: a kept env.json kept saying a project had a tokensave choice
    // nobody made. Purge deletes the home wholesale instead.
    result.reclaimed = opts.purge
      ? []
      : await reclaimConfiguration({
          dryRun: opts.dryRun,
          keepConfig: opts.keepConfig,
          json: opts.json,
          interactive: opts.interactive !== false && process.stdin.isTTY,
          confirm: opts.confirm,
        });

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
