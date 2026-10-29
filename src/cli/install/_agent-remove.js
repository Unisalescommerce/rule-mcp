/** @module cli/install/agent-remove - take this server's install out of one agent */

import { allAgents, uninstallers } from "../installers/index.js";
import { deprecatedAgents } from "../installers/index.js";
import { removeHookFile } from "./_hook-files.js";
import { forgetHost, readManifest } from "./_manifest.js";
import { stopGuardDaemonProcess } from "../guard/_process.js";

/**
 * Remove this server's install from one agent.
 *
 * @param {{ agent: string, dryRun?: boolean }} args
 */
export const uninstallAgent = ({ agent, dryRun = false }) => {
  // Legacy names redirect to their successor (windsurf -> devin).
  const redirect = agent === "all" ? undefined : deprecatedAgents.get(agent);
  const target = redirect ?? agent;
  // `--agent all` sweeps the live catalog (which holds no deprecated names).
  const selected = target === "all" ? allAgents.filter((name) => !deprecatedAgents.has(name)) : [target];
  const warnings = redirect ? [`"${agent}" is deprecated - use "${redirect}" instead.`] : [];
  const surfacedWarnings = warnings.length > 0 ? warnings : undefined;

  if (!uninstallers[target] && target !== "all") {
    throw new Error(`Unsupported agent: "${agent}". Supported agents: ${allAgents.join(", ")}`);
  }

  const result = {};

  for (const name of selected) {
    if (!uninstallers[name]) {
      result[name] = { error: `No uninstaller for "${name}"` };
      continue;
    }

    try {
      result[name] = uninstallers[name]({ dryRun });
      // The manifest is what an uninstall reads, so an uninstall has to empty it:
      // a host left recorded after its files are gone is a doctor reporting a
      // host nobody installed.
      forgetHost({ agent: name, dryRun });
      const file = removeHookFile({ agent: name, dryRun });

      if (file) {
        result[name] = Array.isArray(result[name]) ? [...result[name], { file, action: "hook" }] : { ...result[name], hook: file };
      }
    } catch (error) {
      result[name] = { error: error.message };
    }
  }

  if (!dryRun && readManifest().agents.length === 0) {
    stopGuardDaemonProcess({ dryRun });
  }

  return { ok: true, dryRun, uninstalled: result, warnings: surfacedWarnings };
};
