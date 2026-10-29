/** The configuration and records rule-mcp wrote: where they are, and how to take them back. */

import { existsSync, rmSync } from "node:fs";

import { ENV_CONFIG_FILE, LEGACY_ENV_CONFIG_FILE } from "../installers/_env.js";
import { manifestPath } from "../install/_manifest.js";
import { projectsPath } from "../install/_projects.js";

/**
The configuration and record files rule-mcp wrote, whichever of them exist.

An uninstall removes the server from each agent's config but not these: the
switches file keeps a tokensave `0` nobody chose, and the manifest and
projects store keep pointing at installs that are gone. Listed even when
absent, so a run can say what it looked for instead of guessing.

@returns {Array<{ id: string, label: string, file: string, exists: boolean }>}
*/
export function reclaimTargets() {
  return [
    { id: "env-config", label: "Switches (env.json)", file: ENV_CONFIG_FILE() },
    { id: "legacy-env-config", label: "Legacy switches and stored model keys", file: LEGACY_ENV_CONFIG_FILE },
    { id: "manifest", label: "Install manifest", file: manifestPath() },
    { id: "projects", label: "Recorded projects", file: projectsPath() },
  ].map((target) => ({ ...target, exists: existsSync(target.file) }));
}

/**
Delete the files the reclaim names.

@param {{ dryRun?: boolean, ids?: string[] }} [options]
@returns {Array<{ id: string, file: string, status: "removed"|"planned"|"absent" }>}
*/
export function reclaimConfig({ dryRun = false, ids } = {}) {
  return reclaimTargets()
    .filter((target) => ids === undefined || ids.includes(target.id))
    .map((target) => {
      if (!target.exists) {
        return { id: target.id, file: target.file, status: "absent" };
      }

      if (dryRun) {
        return { id: target.id, file: target.file, status: "planned" };
      }

      rmSync(target.file, { force: true });

      return { id: target.id, file: target.file, status: "removed" };
    });
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
