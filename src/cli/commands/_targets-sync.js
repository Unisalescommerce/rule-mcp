/** @module cli/commands/targets-sync - write the command files into every resolved target */

import { renderAgentCommandFiles } from "../../core/agents/commands/index.js";
import { activeRoles, personaCommandName } from "../../core/review/roles/index.js";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { print } from "./_shared.js";
import { dirname, resolve } from "node:path";
import { resolvedTargets } from "./_targets.js";

/** The suffixes a command file can carry. */
const COMMAND_SUFFIX = /(\.prompt\.md|\.md|\.toml)$/;

/**
 * Whether an entry is a flat command file or a nested skill directory we own
 * (`<name>/SKILL.md`, Devin and Copilot CLI).
 *
 * @param {string} dir
 * @param {string} entry
 * @returns {boolean}
 */
const isRuleCommandEntry = (dir, entry) => {
  // Flat files are `rule.md` / `rule-*.md`; nested skills are `rule/` or `rule-*/`.
  if (!(entry === "rule" || /^rule[-.]/.test(entry))) {
    return false;
  }

  const path = resolve(dir, entry);

  try {
    if (statSync(path).isDirectory()) {
      return existsSync(resolve(path, "SKILL.md"));
    }
  } catch {
    return false;
  }

  return entry.endsWith(".md") || entry.endsWith(".toml") || entry.endsWith(".prompt.md");
};

/**
 * Persona command files that name no active role.
 *
 * A sync writes the rendered set, which carries one name per active role.
 * Anything under the persona prefix outside that set is a file no command
 * reaches, whatever shape it has (ADR 120, ADR 116).
 *
 * @param {string} dir - target directory (used when entries are skill dirs)
 * @param {string[]} entries - directory entries
 * @returns {string[]} the files or skill dirs to remove
 */
function stalePersonaFiles(dir, entries) {
  const current = new Set(activeRoles().map((role) => personaCommandName(role.id)));

  return entries.filter((entry) => {
    if (!isRuleCommandEntry(dir, entry)) {
      return false;
    }

    const name = entry.replace(COMMAND_SUFFIX, "");

    return name.startsWith("rule-persona-") && !current.has(name);
  });
}

/**
 * Write (or remove with `--remove`) the whole clean command set in every resolved
 * target directory, so a single call covers every agent/IDE on this machine.
 *
 * @param {{ agent?: string, remove?: boolean, dryRun?: boolean, json?: boolean, only?: string[] }} opts
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

    // Purge persona files that name no current role (ADR 120), so a target
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
