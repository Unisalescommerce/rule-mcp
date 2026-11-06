/** @module cli/commands/targets-sync - write the command files into every resolved target */

import { renderAgentCommandFiles } from "../../core/agents/commands/index.js";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { print } from "./_shared.js";
import { isRuleCommandEntry, stalePersonaFiles } from "./_targets-stale.js";
import { dirname, resolve } from "node:path";
import { resolvedTargets } from "./_targets-resolve.js";

/**
 * Write, or remove, the rendered command set in every resolved target.
 *
 * @param {object} opts
 */
export function syncCommandTargets(opts) {
  // A removal also sweeps the directories an earlier release wrote to; a write
  // only touches the current one.
  const targets = resolvedTargets({ ...opts, includeLegacy: Boolean(opts.remove) });

  if (targets.length === 0) {
    print("agent-commands: no agent command directories found on this machine");

    return;
  }

  let files = 0;

  for (const { label, format, dir } of targets) {
    const rendered = renderAgentCommandFiles(format, opts.only ?? undefined);

    if (!opts.dryRun && !opts.remove) {
      mkdirSync(dir, { recursive: true });
    }

    // A legacy directory is removal-only: nothing is written there.
    if (opts.remove && !opts.dryRun && !existsSync(dir)) {
      continue;
    }

    // Remove sweeps the whole `rule-mcp` namespace in the target dir, so names that
    // left the registry (a rename, a deletion) are purged too instead of
    // lingering as stale commands next to the new set. The separator matters:
    // the root command is `rule.md`, not `rule-mcp-something.md`, and a bare `rule-`
    // prefix left it behind on every uninstall.
    if (opts.remove) {
      // A detected agent does not always have its command directory yet -
      // Pi is detected from ~/.pi/agent/mcp.json while the prompts dir is
      // created on first write. readdirSync would throw ENOENT and take the
      // whole removal down with it.
      if (!existsSync(dir)) {
        print(`  ${label}: no command directory → ${dir}`);
        continue;
      }

      const stale = readdirSync(dir).filter((entry) => isRuleCommandEntry(dir, entry));

      for (const entry of stale) {
        const file = resolve(dir, entry);

        if (!opts.dryRun) {
          rmSync(file, { force: true, recursive: true });
        }
      }

      files += stale.length;
      print(`  ${opts.dryRun ? "[dry-run] " : ""}${label}: removed ${stale.length} rule* command file(s) → ${dir}`);
      continue;
    }

    for (const { filename, content } of rendered) {
      const file = resolve(dir, filename);

      if (!opts.dryRun) {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, content);
      }

      files += 1;
    }

    // Purge persona files that name no current role (ADR 112), so a target
    // directory holds exactly the rendered set. A dry run has not created the
    // directory yet.
    const stale = stalePersonaFiles(dir, existsSync(dir) ? readdirSync(dir) : []);

    for (const entry of stale) {
      if (!opts.dryRun) {
        rmSync(resolve(dir, entry), { force: true, recursive: true });
      }

      files += 1;
    }

    const purged = stale.length > 0 ? `, purged ${stale.length} persona file(s)` : "";

    print(`  ${label}: wrote ${rendered.length}${purged} ${format} command file(s) → ${dir}`);
  }

  print(`agent-commands: ${opts.remove ? "removed" : "synced"} ${files} file(s) across ${targets.length} directory(ies)`);
}
