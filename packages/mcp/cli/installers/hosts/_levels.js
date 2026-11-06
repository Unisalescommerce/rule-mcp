/**
 * @module cli/installers/hosts/levels
 *
 * The rungs a host can reach, derived from the four registries this tree already
 * keeps: rules from the files an install writes, commands from the command
 * targets and their documented gaps, hooks from the hook table, and a handler
 * from the two hosts that document one.
 *
 * Derived rather than declared, because a second list of hosts would be a second
 * thing to keep in step - and the drift is invisible: a ceiling a reader cannot
 * check is a ceiling nobody maintains.
 */

import { join } from "node:path";

import { HOME } from "../_paths.js";
import { AGENTS_WITHOUT_COMMAND_SURFACE, COMMAND_TARGETS } from "../../../core/agents/command-targets/index.js";
import { hookSupport } from "../../install/_hook-hosts.js";

/** Where an install writes the instruction block, for the hosts that have one. */
const RULES = {
  claude: () => join(HOME, ".claude", "CLAUDE.md"),
  codex: () => join(HOME, ".codex", "AGENTS.md"),
  cursor: () => join(HOME, ".cursorrules"),
  gemini: () => join(HOME, ".gemini", "GEMINI.md"),
  copilot: () => join(HOME, ".copilot", "copilot-instructions.md"),
};

/** The hosts that document a handler of their own, which is what L4 needs. */
const EXTENSIONS = {
  pi: { status: "documented", reason: "`pi.registerCommand` runs a handler with no model in the loop" },
  copilot: { status: "experimental", reason: "JavaScript Extensions register real slash commands, still behind an experimental flag" },
};

const commandAgents = new Set(COMMAND_TARGETS.map((target) => target.agent));

/**
 * The rungs a host can reach, with the reason for each one it cannot.
 *
 * The ladder is cumulative in intent, not in shape: a host installs every rung
 * it supports up to the level asked for, and a rung it does not support is
 * skipped with its reason instead of blocking the ones above it. Kiro is the
 * case that makes this necessary - it writes a hook file and has no command
 * files at all, so a strict ladder would cap it at L0 and hide a surface the
 * study measured.
 */
export function levelsOf(id) {
  const hook = hookSupport(id);
  const extension = EXTENSIONS[id];

  return {
    L0: { supported: true, reason: "the MCP entry, which every host reads" },
    L1: RULES[id] ? { supported: true, path: RULES[id]() } : { supported: false, reason: "no instructions file is documented for this host" },
    L2: commandAgents.has(id) ? { supported: true } : { supported: false, reason: AGENTS_WITHOUT_COMMAND_SURFACE[id] ?? "no command-file surface was measured" },
    L3: hook.writable ? { supported: true, file: hook.file } : { supported: false, reason: hook.reason ?? "no hook mechanism" },
    L4: extension ? { supported: true, ...extension } : { supported: false, reason: "no handler API is documented" },
  };
}

/** The highest rung a host supports. */
export function ceilingOf(levels) {
  return ["L4", "L3", "L2", "L1"].find((rung) => levels[rung].supported) ?? "L0";
}

/**
 * What each rung writes, in words rather than in codes.
 *
 * `L0..L4` is the vocabulary of `--level` and of the ceiling table in
 * `docs/06-integration-levels.md`, and it stays: a flag needs a short spelling. What a
 * reader of the wizard needs is the other half - a screen that says "server,
 * rules and commands" instead of asking them to remember what `L2` was.
 *
 * `title` names the rung in full, for a row label; `adds` names only what that
 * rung contributes over the one below it, for the note beside the label.
 */
export const RUNG_WORDS = {
  L0: { title: "Server only", adds: "the MCP entry" },
  L1: { title: "Server and rules", adds: "the rules file" },
  L2: { title: "Server, rules and commands", adds: "the /rule-* command files" },
  L3: { title: "Server, rules, commands and hooks", adds: "the guard hooks" },
  L4: { title: "Everything, plus a native handler", adds: "the host's own handler" },
};

/**
 * A rung in the words of a sentence rather than in the words of a flag.
 *
 * @param {string} rung one of L0..L4
 * @returns {string} the title, lowercased, or the rung itself when unknown
 */
export const rungWords = (rung) => RUNG_WORDS[rung]?.title.toLowerCase() ?? rung;
