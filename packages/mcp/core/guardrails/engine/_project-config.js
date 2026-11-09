/**
 * @module core/guardrails/engine/project-config
 *
 * The project's choices about which guardrails run, read from
 * `.rule-mcp/config.json` at the project root:
 *
 *   { "guardrails": { "baseline": "full" | "minimal", "disable": ["rule-id"] } }
 *
 * No file is the default, and the default is what every check did before this
 * file existed. A file that does not parse, or a value this reader does not
 * know, is reported and read as the default: a typo must never switch rules off.
 *
 * Decision: docs/adr/_pending/a-project-chooses-its-guardrails-in-rule-mcp-config-json.md
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { findProjectRoot } from "../../../cli/paths/index.js";

/** Where the file lives, relative to the project root. */
export const CONFIG_FILE = join(".rule-mcp", "config.json");

/** `full`: the baseline skills ride every check. `minimal`: a check runs only the skill it names. */
export const BASELINE_LEVELS = ["full", "minimal"];

export const DEFAULT_GUARDRAIL_CONFIG = Object.freeze({ baseline: "full", disable: Object.freeze([]) });

/**
 * Read and validate the project's guardrail config.
 *
 * @param {{ cwd?: string }} [options]
 * @returns {{ config: { baseline: string, disable: string[] }, file: string|null, problems: string[] }}
 */
export function readGuardrailConfig({ cwd = process.cwd() } = {}) {
  const file = join(findProjectRoot(cwd), CONFIG_FILE);
  const problems = [];

  if (!existsSync(file)) {
    return { config: DEFAULT_GUARDRAIL_CONFIG, file: null, problems };
  }

  let raw;

  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    problems.push(`${file}: not valid JSON (${error.message}); every rule runs`);

    return { config: DEFAULT_GUARDRAIL_CONFIG, file, problems };
  }

  const section = raw?.guardrails ?? {};

  if (typeof section !== "object" || Array.isArray(section)) {
    problems.push(`${file}: "guardrails" must be an object; every rule runs`);

    return { config: DEFAULT_GUARDRAIL_CONFIG, file, problems };
  }

  let baseline = section.baseline ?? "full";

  if (!BASELINE_LEVELS.includes(baseline)) {
    problems.push(`${file}: "guardrails.baseline" is ${JSON.stringify(baseline)}, expected one of ${BASELINE_LEVELS.join(", ")}; the full baseline runs`);
    baseline = "full";
  }

  const listed = section.disable ?? [];
  let disable = [];

  if (Array.isArray(listed)) {
    disable = listed.filter((id) => typeof id === "string" && id.trim() !== "");

    if (disable.length !== listed.length) {
      problems.push(`${file}: "guardrails.disable" holds ${listed.length - disable.length} entry(ies) that are not rule ids; they are ignored`);
    }
  } else {
    problems.push(`${file}: "guardrails.disable" must be a list of rule ids; nothing is disabled`);
  }

  return { config: { baseline, disable }, file, problems };
}

/** The installed choices, as the registry reads them on every check. */
let installed = { baseline: "full", disable: new Set() };

/**
 * Install the project's guardrail choices.
 *
 * @param {{ baseline?: string, disable?: string[] }} [config]
 */
export function setGuardrailConfig({ baseline = "full", disable = [] } = {}) {
  installed = { baseline, disable: new Set(disable) };
}

/** @returns {{ baseline: string, disable: Set<string> }} the installed choices */
export function projectGuardrailConfig() {
  return installed;
}
