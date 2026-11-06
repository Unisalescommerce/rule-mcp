/**
 * @module cli/commands/targets-stale
 *
 * How a sync decides that an entry under a command directory is one of ours, and
 * which of them no command reaches any more.
 *
 * Separated from the sync itself because it is the half that has to be right: a
 * sweep that misses leaves a command nobody can explain, and a sweep that
 * overreaches deletes a file the user wrote.
 */

import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { activeRoles, personaCommandName } from "../../core/review/roles/index.js";

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
export const isRuleCommandEntry = (dir, entry) => {
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
 * reaches, whatever shape it has (ADR 112, ADR 108).
 *
 * @param {string} dir - target directory (used when entries are skill dirs)
 * @param {string[]} entries - directory entries
 * @returns {string[]} the files or skill dirs to remove
 */
export function stalePersonaFiles(dir, entries) {
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
