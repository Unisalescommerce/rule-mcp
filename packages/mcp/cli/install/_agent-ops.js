/** @module cli/install/agent-ops - install into and remove from one agent config */

import { allAgents, normalizeInstallMode, remoteModeAgents, installers } from "../installers/index.js";

export * from "../installers/index.js";
import { deprecatedAgents } from "../installers/index.js";
import { installHookFile } from "./_hook-files.js";

import { writeInstalledManifest } from "./_manifest-write.js";
import { nonInstallable } from "../installers/hosts/_evidence.data.js";
import { startGuardDaemonProcess } from "../guard/_process.js";

/**
 * Whether an agent can be reached in a mode, before anything is written.
 *
 * Daemon and docker configs are verified only for pi and vscode, but the
 * writers know the shape for every agent: `force` means the owner checked
 * their client speaks SSE, so the failure downgrades to a warning that
 * keeps the safe default visible. Pure, so the rule is tested where it is
 * decided instead of through a home directory.
 *
 * @param {string} name
 * @param {string} normalizedMode
 * @param {boolean} [force]
 * @returns {{ error?: string, warning?: string }|null}
 */
export function checkRemoteSupport(name, normalizedMode, force = false) {
  if (normalizedMode === "stdio" || remoteModeAgents.has(name)) {
    return null;
  }

  if (force) {
    return { warning: `Install mode "${normalizedMode}" is verified only for Pi and VS Code; wrote it for ${name} anyway - stdio stays the supported choice.` };
  }

  return { error: `Install mode "${normalizedMode}" is currently supported only for Pi and VS Code; use stdio for ${name}.` };
}

/**
 * Install rule-mcp into one or more agents.
 * Writes an installed.md manifest after successful installation.
 *
 * `hooks` installs the guard hooks for each selected agent that documents a
 * hook file: a host that was not selected is never touched.
 *
 * @param {{ agent: string, entrypoint: string, dryRun?: boolean, force?: boolean, global?: boolean, mode?: "stdio"|"daemon"|"sse"|"docker", hooks?: boolean }} opts
 * @returns {{ ok: boolean, dryRun: boolean, global: boolean, installed: object, manifest?: string }}
 */
export const installAgent = ({ agent, entrypoint, dryRun = false, force = false, global = false, mode = "stdio", hooks = false, level = null, _env = {} }) => {
  const normalizedMode = normalizeInstallMode(mode);
  // Legacy names redirect to their successor (windsurf -> devin): the
  // catalog no longer offers them, but naming one still works and warns.
  const redirect = agent === "all" ? undefined : deprecatedAgents.get(agent);
  const target = redirect ?? agent;
  // `--agent all` sweeps the live catalog (which holds no deprecated names).
  const selected = target === "all" ? allAgents.filter((name) => !deprecatedAgents.has(name)) : [target];
  const warnings = redirect ? [`"${agent}" is deprecated - use "${redirect}" instead.`] : agent === "all" ? [] : [];
  // Computed at the returns, not here: the loop below appends per-agent
  // warnings (remote transports, `--force`), which an early snapshot drops.
  const surfacedWarnings = () => (warnings.length > 0 ? warnings : undefined);

  if (!installers[target] && target !== "all") {
    // A product the study measured is a different answer from a typo: one has no
    // documented config file to write, the other is not a product at all.
    const measured = nonInstallable().find((row) => row.id === target);

    throw new Error(
      measured ? `"${agent}" cannot be installed: ${measured.reason}. Nothing was written.` : `Unsupported agent: "${agent}". Supported agents: ${allAgents.join(", ")}`,
    );
  }

  const result = {};

  for (const name of selected) {
    if (!installers[name]) {
      result[name] = { error: `No installer for "${name}"` };
      continue;
    }

    const support = checkRemoteSupport(name, normalizedMode, force);

    if (support?.error) {
      result[name] = { error: support.error };
      continue;
    }

    if (support?.warning) {
      warnings.push(support.warning);
    }

    try {
      result[name] = installers[name]({ entrypoint, dryRun, global, force, mode: normalizedMode });

      if (hooks) {
        const file = installHookFile({ agent: name, entrypoint, dryRun });

        if (file) {
          result[name] = Array.isArray(result[name]) ? [...result[name], { file, action: "hook" }] : { ...result[name], hook: file };
        }
      }
    } catch (error) {
      result[name] = { error: error.message };
    }
  }

  const ok = Object.values(result).every((entry) => !entry?.error);
  const wroteHooks = hooks && Object.values(result).some((entry) => entry?.hook || (Array.isArray(entry) && entry.some((row) => row?.action === "hook")));

  if (wroteHooks) {
    const daemon = startGuardDaemonProcess({ dryRun });

    if (!dryRun && daemon.action === "started") {
      warnings.push("started the guard daemon for hook --send clients");
    }
  }

  if (!dryRun) {
    const manifestPath = writeInstalledManifest(selected, entrypoint, global, normalizedMode, level);

    return {
      ok,
      dryRun,
      global,
      mode: normalizedMode,
      installed: result,
      manifest: manifestPath,
      warnings: surfacedWarnings(),
    };
  }

  return { ok, dryRun, global, mode: normalizedMode, installed: result, warnings: surfacedWarnings() };
};

// ─── Uninstallers ───────────────────────────────────────────────────────────

export { uninstallAgent } from "./_agent-remove.js";
