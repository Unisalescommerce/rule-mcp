/**
@module cli/setup/task-attribution
 *
 * The attribution step: apply the chosen mode to every agent whose row has a
 * cited page, and say which agents it will not touch and why.
 *
 * The task never guesses. An agent whose row is `unverified`, or whose
 * mechanism is `none` because the vendor documents no control, is reported by
 * name instead of being written with a setting nobody read.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { attributionRow, attributionRows } from "../installers/_attribution.js";
import { applyAttribution } from "../installers/_attribution.js";
import { writeText } from "../installers/_paths.js";

/** Resolve a `~/` path at call time, so a temp HOME in a test is honored. */
const resolve = (file) => (file?.startsWith("~/") ? join(homedir(), file.slice(2)) : file);

/**
The agents a run will write, and the ones it will leave alone.

@param {{ mode?: "keep"|"hide", agents?: string[] }} options
@returns {{ targets: object[], skipped: object[] }}
*/
export function attributionTargets({ agents = [] } = {}) {
  const narrowed = agents.length > 0 ? agents : null;
  const rows = narrowed ? narrowed.map((agent) => attributionRow(agent)).filter(Boolean) : attributionRows();
  const targets = [];
  const skipped = [];

  for (const row of rows) {
    const writable = row.evidence !== "unverified" && row.mechanism !== null && row.mechanism !== "none" && Boolean(row.key);

    if (writable) {
      targets.push(row);
    } else {
      skipped.push({ agent: row.agent, reason: row.mechanism === "none" ? "documents no attribution control" : "not documented here" });
    }
  }

  return { targets, skipped };
}

/**
The attribution task for the install plan.

@param {{ mode?: "keep"|"hide", agents?: string[] }} [options]
*/
export const attributionTask = ({ mode = "keep", agents = [] } = {}) => ({
  id: "attribution",
  title: "Attribution",
  detail: `${mode} - ${attributionTargets({ agents }).targets.map((row) => row.agent).join(", ") || "no documented agent"}`,
  run: ({ dryRun }) => {
    const { targets, skipped } = attributionTargets({ agents });
    const lines = [];
    let written = 0;

    for (const row of targets) {
      const file = resolve(row.file);
      const current = existsSync(file) ? readFileSync(file, "utf8") : "";
      const result = applyAttribution(row.agent, current, { mode });

      if (result.status === "applied") {
        writeText({ file, content: result.text, dryRun });
        written += 1;
      }

      lines.push(`${result.status.padEnd(14)} ${row.agent} ${file}`);
    }

    lines.push(...skipped.map((entry) => `${"skipped".padEnd(14)} ${entry.agent}: attribution ${entry.reason}`));

    return {
      status: "ok",
      summary: `${written} file(s), ${skipped.length} left alone`,
      lines,
    };
  },
});
