/**
 * @module core/commit/hook
 *
 * The hook files rule-mcp installs, and the idempotent write of one.
 *
 * A hook whose file is already ours is left alone; a hook someone else wrote is
 * kept beside ours as `<name>.rule-mcp-backup` and chained from the end of ours, so
 * integrating never destroys another tool's work. A hook whose validator is not
 * on `PATH` warns and lets the commit through: a gate that cannot run must not
 * make the repository unusable.
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getRuntimePaths } from "../../cli/paths/index.js";

/** The marker every file this module writes carries. */
export const HOOK_MARKER = "rule-mcp:commit-lint";

/** The suffix a hook we displaced is kept under. */
export const BACKUP_SUFFIX = ".rule-mcp-backup";

/** The default binary the hooks invoke. */
export const DEFAULT_COMMAND = "rule-mcp";

/**
 * The one command a hook of this name runs.
 *
 * @param {string} name "commit-msg" or "pre-push"
 * @param {string} command
 * @returns {string}
 */
function lintCommand(name, command) {
  return name === "commit-msg" ? `${command} commit-lint --msg-file "$1"` : `${command} commit-lint --stdin-push`;
}

/**
 * The shell text of one hook.
 *
 * `set -e` is left to the explicit `exit`s: the validator's failure is what
 * blocks the commit or the push, and the chained backup runs only after it
 * passed.
 *
 * The probe runs the launcher, not `command -v` alone. A launcher whose target
 * moved - a checkout on a branch that does not ship the entry point - exists and
 * cannot run; treating that as "on PATH" turned every `git push` on the machine
 * into a node stack trace, which is the opposite of what this file promises.
 *
 * A skip is also written down: the warning scrolls away, and "the gate was off
 * yesterday at 14:02" is a question someone asks after a release lands
 * unchecked. Recording is a courtesy - a record that cannot be written never
 * blocks the push.
 *
 * @param {string} name "commit-msg" or "pre-push"
 * @param {string} [command]
 * @param {{ root?: string }} [options] - where the skip record lives
 * @returns {string}
 */
export function hookBody(name, command = DEFAULT_COMMAND, { root = getRuntimePaths().homeDir } = {}) {
  const logDir = join(root, "state");
  const logFile = join(logDir, "launcher-skips.log");

  /** The warning, and the line that outlives it. */
  const skip = (reason) => [

    `    echo "${HOOK_MARKER}: ${reason}; commit validation skipped - run: rule-mcp setup" >&2`,
    `    mkdir -p ${JSON.stringify(logDir)} 2>/dev/null`,
    String.raw`    printf '%s ${name}: ${reason}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> ${JSON.stringify(logFile)} 2>/dev/null`,
  ];

  return [
    "#!/bin/sh",
    `# ${HOOK_MARKER} - reject a commit or push that is not type(scope): subject.`,
    'dir="$(dirname "$0")"',
    `backup="$dir/${name}${BACKUP_SUFFIX}"`,
    `if command -v ${command} >/dev/null 2>&1; then`,
    `  if ${command} --version >/dev/null 2>&1; then`,
    `    ${lintCommand(name, command)} || exit 1`,
    "  else",
    ...skip(`${command} exists but cannot run`),
    "  fi",
    "else",
    ...skip(`${command} is not on PATH`),
    "fi",
    'if [ -x "$backup" ]; then',
    '  exec "$backup" "$@"',
    "fi",
    "exit 0",
    "",
  ].join("\n");
}

/**
 * @typedef {"installed"|"integrated"|"preserved"} HookOutcome
 */

/**
 * Write one hook, or leave it alone when it is already current.
 *
 * @param {string} hooksDir
 * @param {string} name
 * @param {{ command?: string }} [options]
 * @returns {HookOutcome}
 */
export function writeHook(hooksDir, name, options = {}) {
  mkdirSync(hooksDir, { recursive: true });

  const path = join(hooksDir, name);
  const body = hookBody(name, options.command ?? DEFAULT_COMMAND, { root: options.root });
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;

  if (current === body) {
    return "preserved";
  }

  const foreign = current !== null && !current.includes(HOOK_MARKER);

  if (foreign) {
    // Executable, because our body chains it with `[ -x ]`: a displaced hook
    // stored writable-only is a hook that silently stopped running.
    writeFileSync(`${path}${BACKUP_SUFFIX}`, current);
    chmodSync(`${path}${BACKUP_SUFFIX}`, 0o755);
  }

  writeFileSync(path, body);
  chmodSync(path, 0o755);

  return foreign ? "integrated" : "installed";
}
