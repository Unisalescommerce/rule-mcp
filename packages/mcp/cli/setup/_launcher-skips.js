/**
@module cli/setup/launcher-skips
 *
 * The record of a gate that was skipped because the tool would not start.
 *
 * The hook prints a warning, and a warning scrolls away. A line in
 * `state/launcher-skips.log` is the difference between "the validator is on" and
 * "it was off yesterday at 14:02", which is the question a person asks after a
 * release lands unchecked.
 *
 * A skip is not a failure of the hook: the commit goes through, the line is
 * written, and doctor reports it.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { getRuntimePaths } from "../paths/index.js";

/** How many lines the log keeps before the oldest are dropped. */
export const SKIP_LOG_LIMIT = 200;

/** Where the record lives: `state/launcher-skips.log` under the runtime root. */
export const skipLogPath = ({ root = getRuntimePaths().homeDir } = {}) => join(root, "state", "launcher-skips.log");

/** One line of the record, split into its date and its reason. */
const parseLine = (line) => {
  const match = line.match(/^(\d{4}-\d{2}-\d{2}T\S*)\s+(.*)$/u);

  return match ? { at: match[1], reason: match[2] } : { at: undefined, reason: line };
};

/**
 * Record one skip.
 *
 * @param {{ root?: string, reason: string, now?: Function }} options
 * @returns {{ at: string, reason: string }}
 */
export function appendSkip({ root = getRuntimePaths().homeDir, reason, now = () => new Date().toISOString() }) {
  const file = skipLogPath({ root });
  const at = now();

  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, `${at} ${reason}\n`);

  return { at, reason };
}

/**
 * The most recent skip, if any.
 *
 * @param {{ root?: string }} [options]
 * @returns {{ at: string|undefined, reason: string }|undefined}
 */
export function lastSkip({ root = getRuntimePaths().homeDir } = {}) {
  const file = skipLogPath({ root });

  if (!existsSync(file)) {
    return;
  }

  const lines = readFileSync(file, "utf8").split("\n").filter((line) => line.trim() !== "");

  return lines.length === 0 ? undefined : parseLine(lines.at(-1));
}

/**
 * Keep the newest lines and drop the rest.
 *
 * @param {{ root?: string, keep?: number }} [options]
 * @returns {number} how many lines survive
 */
export function trimSkips({ root = getRuntimePaths().homeDir, keep = SKIP_LOG_LIMIT } = {}) {
  const file = skipLogPath({ root });

  if (!existsSync(file)) {
    return 0;
  }

  const lines = readFileSync(file, "utf8").split("\n").filter((line) => line.trim() !== "");

  if (lines.length <= keep) {
    return lines.length;
  }

  const kept = lines.slice(-keep);

  writeFileSync(file, `${kept.join("\n")}\n`);

  return kept.length;
}
