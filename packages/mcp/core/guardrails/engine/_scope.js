/**
 * @module core/guardrails/engine/scope
 *
 * Where a skill applies and how hard its rules stop a check.
 *
 * `paths` in a SKILL.md frontmatter is a list of globs, relative to the project
 * root: a path-routed check (the CLI, the commit hook) sends a matching file to
 * that skill on top of the skill its extension picks. `severity` is `block`
 * (the default, what every rule did before) or `warn`: a skill sets the default
 * for its rules, and a rule object can say otherwise.
 *
 * Decision: docs/adr/_pending/a-skill-names-its-paths-and-a-rule-its-severity.md
 */

import { matchesGlob } from "node:path";

/** The severities a rule can carry; the first is the default. */
export const SEVERITIES = ["block", "warn"];

/**
 * The rules of one skill with their severity resolved: the rule's own value,
 * else the skill's, else `block`. An unknown value is reported and blocks.
 *
 * @param {{ name: string, layer: string, meta: { severity?: string } }} entry
 * @param {object[]} rules
 * @param {object[]} problems - where an unknown value is reported
 * @returns {object[]}
 */
export function withSeverity(entry, rules, problems) {
  const known = (value, what) => {
    if (value === undefined || SEVERITIES.includes(value)) {
      return value;
    }

    problems.push({ skill: entry.name, layer: entry.layer, reason: `${what} has severity "${value}", expected ${SEVERITIES.join(" or ")}; it blocks` });

    return "block";
  };
  const fallback = known(entry.meta.severity, "the skill") ?? SEVERITIES[0];

  return rules.map((rule) => ({ ...rule, severity: known(rule.severity, `rule "${rule.id}"`) ?? fallback }));
}

/** Skill name to its `paths` globs, installed beside the skill rules. */
let SKILL_PATHS = new Map();

/** @param {Map<string, { paths?: string[] }>} skills */
export function setSkillPaths(skills) {
  SKILL_PATHS = skills instanceof Map ? skills : new Map();
}

/**
 * The skills whose `paths` match a project-relative file path.
 *
 * @param {string} file
 * @returns {string[]}
 */
export function skillsForGlobs(file) {
  const path = file.replaceAll("\\", "/").replace(/^\.\//, "");
  const names = [];

  for (const [name, { paths = [] }] of SKILL_PATHS) {
    if (paths.some((glob) => matchesGlob(path, glob))) {
      names.push(name);
    }
  }

  return names;
}
